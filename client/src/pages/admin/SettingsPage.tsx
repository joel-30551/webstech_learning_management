import React, { useState } from 'react';
import {
  BookOpen, ShieldCheck, Lock, ChevronDown,
  Users, GraduationCap, UserCog, Calendar, FileText, KeyRound,
  Database, Eye, Settings,
} from 'lucide-react';
import './SettingsPage.css';

type SectionKey = 'manual' | 'privacy' | 'security';

interface ManualTopic {
  icon: React.ReactNode;
  title: string;
  points: string[];
}

const manualTopics: ManualTopic[] = [
  {
    icon: <Users size={16} />,
    title: 'Managing Students',
    points: [
      'Go to the Students Registry to add, edit, or remove student records.',
      'A Student ID is generated automatically when you add a new student — you never need to type one in.',
      'Use the search bar and the Status / Exam Type / Class filters to quickly narrow down the list.',
      'Click the profile icon on any row to view full student details, including guardian contacts.',
    ],
  },
  {
    icon: <GraduationCap size={16} />,
    title: 'Managing Teachers',
    points: [
      'The Teachers Registry works the same way as Students — add, edit, search, and view profiles.',
      'Each teacher can be linked to a user account so they can log in with their own credentials.',
      'A Teacher ID is generated automatically for every new record.',
    ],
  },
  {
    icon: <UserCog size={16} />,
    title: 'Managing Accountants & User Accounts',
    points: [
      'Accountants are managed from the Accountants Registry, and follow the same add/edit/search pattern.',
      'User Accounts control who can log in and what role they have (Admin, Teacher, Accountant, Student).',
      'Deactivating a user account immediately blocks that person from logging in without deleting their record.',
    ],
  },
  {
    icon: <Calendar size={16} />,
    title: 'Uploading Timetables',
    points: [
      'Timetables are uploaded as PDF files from the Timetable Management page.',
      'Each timetable is tagged with a Term, Stream (WASSCE or NOVDEC), and Academic Year.',
      'Files can be viewed or downloaded directly from the table, and replaced later by editing the entry.',
    ],
  },
  {
    icon: <FileText size={16} />,
    title: 'Your Own Profile',
    points: [
      'Update your name and phone number, or change your password, from the Profile page at any time.',
      'Your role and account creation date are shown on the Profile page but can only be changed by another admin.',
    ],
  },
];

interface AccordionSection {
  key: SectionKey;
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
}

const sections: AccordionSection[] = [
  { key: 'manual', icon: <BookOpen size={18} />, iconClass: 'icon-blue', title: 'Admin User Manual', subtitle: 'How to manage every part of the portal' },
  { key: 'privacy', icon: <ShieldCheck size={18} />, iconClass: 'icon-green', title: 'Privacy', subtitle: 'What we store, and who can see it' },
  { key: 'security', icon: <Lock size={18} />, iconClass: 'icon-red', title: 'Security', subtitle: 'Passwords and good account hygiene' },
];

const SettingsPage: React.FC = () => {
  const [openSection, setOpenSection] = useState<SectionKey | null>('manual');

  const toggleSection = (key: SectionKey) => {
    setOpenSection(prev => (prev === key ? null : key));
  };

  return (
    <div className="mgmt-page">
      {/* Header */}
      <div className="mgmt-header">
        <div>
          <h2>Settings & Resources</h2>
          <p>Admin user manual, privacy notes, and security guidance for this portal.</p>
        </div>
      </div>

      <div className="settings-accordion">
        {sections.map(section => {
          const isOpen = openSection === section.key;
          return (
            <div key={section.key} className={`settings-card ${isOpen ? 'open' : ''}`}>
              <button className="settings-card-header" onClick={() => toggleSection(section.key)}>
                <span className={`settings-card-icon ${section.iconClass}`}>{section.icon}</span>
                <span className="settings-card-heading">
                  <span className="settings-card-title">{section.title}</span>
                  <span className="settings-card-subtitle">{section.subtitle}</span>
                </span>
                <ChevronDown size={18} className="settings-card-chevron" />
              </button>

              <div className="settings-card-body-wrapper">
                <div className="settings-card-body">
                  {section.key === 'manual' && (
                    <div className="manual-topics">
                      {manualTopics.map(topic => (
                        <div key={topic.title} className="manual-topic">
                          <p className="manual-topic-title">
                            <span className="manual-topic-icon">{topic.icon}</span>
                            {topic.title}
                          </p>
                          <ul className="manual-topic-list">
                            {topic.points.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.key === 'privacy' && (
                    <div className="settings-text-block">
                      <p className="settings-block-heading"><Database size={15} /> What information is stored</p>
                      <p>
                        This portal stores the personal details needed to run the school day to day: names,
                        contact details, guardian information, class/course assignments, and login credentials
                        for staff and student accounts. Passwords are never stored or displayed in plain text.
                      </p>

                      <p className="settings-block-heading"><Eye size={15} /> Who can see it</p>
                      <ul>
                        <li>Admins can view and manage all student, teacher, and accountant records.</li>
                        <li>Staff can generally only view records relevant to their role (e.g. teachers see their own classes).</li>
                        <li>Students and guardians only see their own profile information, not other students' records.</li>
                      </ul>

                      <p className="settings-block-heading"><FileText size={15} /> Data retention</p>
                      <p>
                        Records are kept for as long as a person is enrolled or employed at the school, plus
                        any additional period required for academic or regulatory record-keeping. Deleting a
                        record from a registry removes it permanently from the active system.
                      </p>
                    </div>
                  )}

                  {section.key === 'security' && (
                    <div className="settings-text-block">
                      <p className="settings-block-heading"><KeyRound size={15} /> Passwords</p>
                      <ul>
                        <li>Use a password that's at least 8 characters long and not reused from another site.</li>
                        <li>Change your password immediately if you suspect someone else has seen it.</li>
                        <li>Admins can deactivate any account instantly from the User Accounts page if access needs to be revoked.</li>
                      </ul>

                      <p className="settings-block-heading"><Settings size={15} /> Good habits</p>
                      <ul>
                        <li>Always log out from shared or public computers when you're done.</li>
                        <li>Don't share your login credentials with anyone else, even other staff.</li>
                        <li>Report anything that looks suspicious — unexpected record changes, logins you don't recognize — to an administrator right away.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsPage;