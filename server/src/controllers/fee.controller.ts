import { Request, Response } from 'express';
import Fee from '../models/Fee.model';


// POST /api/fees
export const createFee = async (req: Request, res: Response) => {
  try {
    const { studentId, class: className, term, academicYear, totalFee, amountPaid, paymentMethod, receivedBy } = req.body;

    if (!studentId || !className || !term || !academicYear || totalFee === undefined || !paymentMethod || !receivedBy) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Fee.findOne({ studentId, term, academicYear });
    if (existing) {
      return res.status(409).json({ message: 'Fee record already exists for this student/term/year. Use update instead.' });
    }

    const fee = await Fee.create({
      studentId,
      class: className,
      term,
      academicYear,
      totalFee,
      amountPaid: amountPaid || 0,
      paymentMethod,
      receivedBy,
    });

    const populated = await fee.populate('studentId', 'studentId fullName class');
    return res.status(201).json(populated);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to create fee record', error: err.message });
  }
};

// GET /api/fees?class=&term=&academicYear=&status=&studentId=
export const getFees = async (req: Request, res: Response) => {
  try {
    const { class: className, term, academicYear, status, studentId } = req.query;
    const filter: Record<string, unknown> = {};
    if (className) filter.class = className;
    if (term) filter.term = term;
    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;

    const fees = await Fee.find(filter)
      .populate('studentId', 'studentId fullName class')
      .sort({ createdAt: -1 });

    return res.json(fees);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch fee records', error: err.message });
  }
};

// GET /api/fees/:id
export const getFeeById = async (req: Request, res: Response) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('studentId', 'studentId fullName class');
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });
    return res.json(fee);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch fee record', error: err.message });
  }
};

// PUT /api/fees/:id  (e.g. recording an additional payment)
export const updateFee = async (req: Request, res: Response) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });

    const { totalFee, amountPaid, paymentMethod, receivedBy, class: className } = req.body;

    if (totalFee !== undefined) fee.totalFee = totalFee;
    if (amountPaid !== undefined) fee.amountPaid = amountPaid;
    if (paymentMethod) fee.paymentMethod = paymentMethod;
    if (receivedBy) fee.receivedBy = receivedBy;
    if (className) fee.class = className;

    await fee.save(); // triggers pre-save hook to recalc balance/status

    const populated = await fee.populate('studentId', 'studentId fullName class');
    return res.json(populated);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to update fee record', error: err.message });
  }
};

// DELETE /api/fees/:id
export const deleteFee = async (req: Request, res: Response) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });

    await fee.deleteOne();
    return res.json({ message: 'Fee record deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to delete fee record', error: err.message });
  }
};

// GET /api/fees/summary?class=&term=&academicYear=
export const getFeeSummary = async (req: Request, res: Response) => {
  try {
    const { class: className, term, academicYear } = req.query;
    const filter: Record<string, unknown> = {};
    if (className) filter.class = className;
    if (term) filter.term = term;
    if (academicYear) filter.academicYear = academicYear;

    const summary = await Fee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: '$totalFee' },
          totalCollected: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balance' },
          studentsCount: { $sum: 1 },
          fullyPaidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          unpaidCount: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } },
        },
      },
      { $project: { _id: 0 } },
    ]);

    return res.json(
      summary[0] || {
        totalExpected: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        studentsCount: 0,
        fullyPaidCount: 0,
        partialCount: 0,
        unpaidCount: 0,
      }
    );
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch fee summary', error: err.message });
  }
};