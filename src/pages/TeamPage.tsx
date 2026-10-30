import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  Edit3,
  MessageSquare,
  Eye,
  Trash2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Building,
  ShieldAlert,
  FileText,
  Check,
  Plus,
  Search,
} from 'lucide-react';
import { Collaborator, DocumentRole, AuditLogEntry, ResearchDocument } from '../lib/types';

interface TeamPageProps {
  members: Collaborator[];
  allDocuments: ResearchDocument[];
  auditLog: AuditLogEntry[];
  currentUserRole: DocumentRole;
  currentUserId: string;
  platformType: 'admin' | 'member' | 'guest';
  onUpdateRole: (userId: string, newRole: DocumentRole) => void;
  onRevokeAccess: (userId: string) => void;
  onTransferOwnership: (newOwnerId: string) => void;
  onAddCollaborator: (collab: Collaborator, initialDocIds?: string[]) => void;
  onToggleDocAssignment?: (userId: string, docId: string) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({
  members,
  allDocuments,
  auditLog,
  currentUserRole,
  currentUserId,
  platformType,
  onUpdateRole,
  onRevokeAccess,
  onTransferOwnership,
  onAddCollaborator,
  onToggleDocAssignment,
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<DocumentRole>('editor');
  const [selectedInitialDocs, setSelectedInitialDocs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToRevoke, setMemberToRevoke] = useState<Collaborator | null>(null);

  const isAdmin = platformType === 'admin';

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4'];
    const newCollab: Collaborator = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
      role: newRole,
      color: colors[members.length % colors.length],
      isOnline: false,
    };

    onAddCollaborator(newCollab, selectedInitialDocs);
    setNewName('');
    setNewEmail('');
    setSelectedInitialDocs([]);
    setIsInviteOpen(false);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-stone-100/70 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-stone-500 uppercase tracking-wider">
              <span>Laboratory Governance</span>
              <span>/</span>
              <span className="text-stone-900 font-semibold">{members.length} Authorized Researchers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              {isAdmin ? 'Research Team & Access Control Matrix' : 'Laboratory Research Members Directory'}
            </h1>
            <p className="text-xs text-stone-600 font-serif mt-0.5">
              {isAdmin
                ? 'Authorize new researchers, assign manuscript access, manage permissions, and review laboratory security logs.'
                : 'Directory of authorized lab investigators, peer reviewers, and scientific contributors.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Authorize New Researcher</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-stone-200/80 rounded-lg text-xs text-stone-600 flex items-center space-x-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Managed by Sunil Paudel (PI)</span>
              </div>
            )}
          </div>
        </div>

        {/* Member View Information Notice */}
        {!isAdmin && (
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-start space-x-3 text-xs text-stone-700">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900">Member Platform Access</p>
              <p className="text-stone-500 mt-0.5">
                Your account is active as a verified ResearchLab Member. You have access exclusively to manuscripts where the laboratory director has assigned you as a collaborator.
              </p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search researchers by name, email, or role..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-stone-900 shadow-2xs"
            />
          </div>
          <div className="text-xs font-mono text-stone-500 hidden sm:block">
            Showing {filteredMembers.length} of {members.length} researchers
          </div>
        </div>

        {/* Collaborators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((c) => {
            const isMe = c.id === currentUserId || (c.email && c.email.toLowerCase() === currentUserId.toLowerCase());
            const isDirector = c.id === 'user-sunil' || c.email.toLowerCase() === 'sunil@researchlab.np' || c.role === 'owner';
            
            // Find which manuscripts this user is assigned to
            const assignedDocs = allDocuments.filter((doc) =>
              doc.collaborators.some(
                (col) => col.id === c.id || col.email.toLowerCase() === c.email.toLowerCase()
              )
            );

            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover border-2"
                        style={{ borderColor: c.color }}
                      />
                      {c.isOnline ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      ) : (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-stone-300 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-semibold text-sm text-stone-900 truncate">{c.name}</h4>
                        {isMe && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-medium">
                            You
                          </span>
                        )}
                        {isDirector && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.2 rounded flex items-center space-x-1">
                            <Crown className="w-2.5 h-2.5 inline" />
                            <span>Director</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 truncate font-mono mt-0.5">{c.email}</p>
                      <div className="flex items-center space-x-2 text-[11px] text-stone-400 mt-0.5">
                        <span>{c.isOnline ? 'Online in workspace' : 'Offline'}</span>
                        <span>•</span>
                        <span>
                          {isDirector
                            ? 'All Manuscripts Access'
                            : `${assignedDocs.length} Manuscript${assignedDocs.length === 1 ? '' : 's'} Assigned`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge or Selector */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {isAdmin && !isDirector ? (
                      <div className="flex items-center space-x-1">
                        <select
                          value={c.role}
                          onChange={(e) => onUpdateRole(c.id, e.target.value as DocumentRole)}
                          className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg bg-stone-50 font-medium text-stone-800"
                        >
                          <option value="editor">Editor</option>
                          <option value="reviewer">Reviewer</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setMemberToRevoke(c)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Revoke Member Authorization from Lab"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase font-mono ${
                          c.role === 'owner'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : c.role === 'editor'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : c.role === 'reviewer'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {c.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Manuscripts Section */}
                <div className="pt-3 border-t border-stone-100 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-stone-700 text-[11px] uppercase tracking-wider font-mono">
                      Paper Authorizations
                    </span>
                    {isAdmin && !isDirector && allDocuments.length > 0 && onToggleDocAssignment && (
                      <span className="text-[10px] text-stone-400">Click paper tag to assign/unassign</span>
                    )}
                  </div>

                  {isDirector ? (
                    <div className="p-2 bg-purple-50/50 rounded-lg text-purple-800 text-[11px] flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Has universal administrative access across all laboratory research papers.</span>
                    </div>
                  ) : allDocuments.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">No research manuscripts initialized yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {allDocuments.map((doc) => {
                        const isAssigned = doc.collaborators.some(
                          (col) => col.id === c.id || col.email.toLowerCase() === c.email.toLowerCase()
                        );

                        if (!isAdmin && !isAssigned) return null;

                        return (
                          <button
                            key={doc.id}
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => onToggleDocAssignment && onToggleDocAssignment(c.id, doc.id)}
                            className={`px-2 py-1 rounded-md text-[11px] flex items-center space-x-1 transition-all ${
                              isAssigned
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium'
                                : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-700 border border-stone-200/60'
                            } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                            title={isAdmin ? (isAssigned ? 'Click to remove from paper' : 'Click to add to paper') : doc.title}
                          >
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[160px]">{doc.title}</span>
                            {isAdmin && (
                              <span className="ml-1 text-[10px] font-bold">
                                {isAssigned ? '✓' : '+'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {assignedDocs.length === 0 && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Not assigned to any paper yet
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Audit Trail */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Security & Document Operation Audit Trail
              </h3>
              <p className="text-xs text-stone-500 font-serif">
                Immutable chronological log of document creations, permissions changes, and external Google Drive exports.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">{auditLog.length} events logged</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {auditLog.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-4 text-center">
                No security audit events recorded yet.
              </p>
            ) : (
              auditLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start justify-between text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 bg-stone-200 rounded text-stone-700 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-900">{log.action}</span>
                        <span className="text-[10px] font-mono text-stone-500">
                          by {log.actorName} ({log.actorRole})
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-stone-600 mt-0.5 text-[11px]">{log.details}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-stone-400 font-mono text-[10px] shrink-0">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Authorize Researcher Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">Authorize New Lab Researcher</h3>
              <p className="text-xs text-stone-500 font-serif mt-0.5">
                Register a new research investigator or reviewer into ResearchLab. Only authorized members can log in.
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jennifer Doudna"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. j.doudna@berkeley.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Access Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as DocumentRole)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="editor">Editor (Can directly modify text and formulas)</option>
                  <option value="reviewer">Reviewer (Can add comments and suggest edits)</option>
                  <option value="viewer">Viewer (Read-only observer)</option>
                </select>
              </div>

              {allDocuments.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Assign to Initial Manuscripts (Optional)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-stone-200 rounded-xl p-2 bg-stone-50/50">
                    {allDocuments.map((doc) => {
                      const isChecked = selectedInitialDocs.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className="flex items-center space-x-2 text-xs text-stone-700 p-1 hover:bg-stone-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInitialDocs((prev) => [...prev, doc.id]);
                              } else {
                                setSelectedInitialDocs((prev) => prev.filter((id) => id !== doc.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{doc.title}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Members can only see the papers they are assigned to.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Authorize Researcher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Member Confirmation Modal */}
      {memberToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Revoke Member Registration?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mt-1 font-serif">
                Are you sure you want to completely deregister{' '}
                <strong className="text-stone-900 font-sans">{memberToRevoke.name}</strong> ({memberToRevoke.email})
                from ResearchLab? This will remove their institutional account and revoke their access from all manuscripts.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setMemberToRevoke(null)}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRevokeAccess(memberToRevoke.id);
                  setMemberToRevoke(null);
                }}
                className="px-5 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Revoke Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
