import React, { useState, useEffect, useRef } from 'react';
import {
  ResearchDocument,
  DocumentRole,
  Collaborator,
  CollaboratorCursor,
  PaperEquation,
  PaperFigure,
  PaperTable,
  ReferenceItem,
  ReferencePdfAttachment,
  DriveExportRecord,
} from './lib/types';
import { ShieldAlert, FileText, Plus, ArrowRight } from 'lucide-react';
import { CollabClient, ConnectionState } from './lib/collab-client';
import { INITIAL_DOCUMENTS, ADMIN_USER, RESEARCH_PERSONAS } from './lib/mock-data';
import { Navigation, PageId } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { ReferencesPage } from './pages/ReferencesPage';
import { TeamPage } from './pages/TeamPage';
import { EditorHeader } from './components/EditorHeader';
import { OutlineSidebar } from './components/OutlineSidebar';
import { DocumentCanvas } from './components/DocumentCanvas';
import { ReviewSidebar } from './components/ReviewSidebar';
import { EquationModal } from './components/EquationModal';
import { FigureTableModal } from './components/FigureTableModal';
import { ReferenceManagerModal } from './components/ReferenceManagerModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ShareModal } from './components/ShareModal';
import { DriveExportModal } from './components/DriveExportModal';
import { AttachPdfModal } from './components/AttachPdfModal';
import { FindReplaceBar } from './components/FindReplaceBar';
import { SplitCollabView } from './components/SplitCollabView';
import { generateDocxBlob } from './lib/docx-export';

export default function App() {
  // Navigation / Page State
  const [currentPage, setCurrentPage] = useState<PageId>('landing');

  // Platform Type: 'admin' | 'member' | 'guest'
  const [platformType, setPlatformType] = useState<'admin' | 'member' | 'guest'>('guest');

  // Authenticated user (starts as null / guest requiring login)
  const [currentPersona, setCurrentPersona] = useState<Collaborator | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<DocumentRole>('viewer');

  // Strict Protection: Normal visitors cannot access internal workspaces (manuscripts, editor, team, references)
  useEffect(() => {
    if (!currentPersona && currentPage !== 'landing' && currentPage !== 'login') {
      setCurrentPage('login');
    }
  }, [currentPersona, currentPage]);

  // Registered members (dynamic list governed strictly by Admin Sunil)
  const [registeredMembers, setRegisteredMembers] = useState<Collaborator[]>(() => {
    try {
      const saved = localStorage.getItem('researchlab_registered_members');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [ADMIN_USER];
  });

  // Documents state (fresh start: starts clean with 0 active papers)
  const [allDocuments, setAllDocuments] = useState<ResearchDocument[]>(() => {
    try {
      const saved = localStorage.getItem('researchlab_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DOCUMENTS; // []
  });

  const [currentDocId, setCurrentDocId] = useState<string>('');
  const [document, setDocument] = useState<ResearchDocument | null>(null);

  // Real-time synchronization state
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isSaving, setIsSaving] = useState(false);
  const [collaboratorCursors, setCollaboratorCursors] = useState<Record<string, CollaboratorCursor>>({});
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  // Active section & selection in editor
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-intro');
  const [selectedText, setSelectedText] = useState<string>('');
  const [activeTargetSectionId, setActiveTargetSectionId] = useState<string>('sec-intro');

  // Layout & Typography
  const [layoutMode, setLayoutMode] = useState<'single' | 'two-column'>('single');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [fontSize, setFontSize] = useState<'10' | '11' | '12'>('11');
  const [lineSpacing, setLineSpacing] = useState<'1.15' | '1.5' | '2.0'>('1.5');

  // Modals & Panels
  const [isReviewSidebarOpen, setIsReviewSidebarOpen] = useState(true);
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [editingEquation, setEditingEquation] = useState<PaperEquation | null>(null);
  const [isFigureModalOpen, setIsFigureModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);

  // Attached PDF modal target
  const [attachPdfTarget, setAttachPdfTarget] = useState<{ ref: ReferenceItem; index: number } | null>(null);

  const clientRef = useRef<CollabClient | null>(null);

  // Access Control: Admin sees all papers; members ONLY see papers they were added to
  const isUserAdmin = platformType === 'admin' || currentPersona?.role === 'owner';
  const authorizedDocuments = isUserAdmin
    ? allDocuments
    : allDocuments.filter(doc =>
        doc.collaborators.some(
          c => c.id === currentPersona?.id || (currentPersona?.email && c.email.toLowerCase() === currentPersona.email.toLowerCase())
        )
      );

  // Keep selected document synced
  useEffect(() => {
    if (!currentDocId) {
      if (authorizedDocuments.length > 0) {
        setCurrentDocId(authorizedDocuments[0].id);
        setDocument(authorizedDocuments[0]);
      } else {
        setDocument(null);
      }
      return;
    }

    const doc = allDocuments.find(d => d.id === currentDocId);
    if (doc) {
      // Check authorization for members
      if (!isUserAdmin) {
        const isAllowed = doc.collaborators.some(
          c => c.id === currentPersona?.id || (currentPersona?.email && c.email.toLowerCase() === currentPersona.email.toLowerCase())
        );
        if (!isAllowed) {
          if (authorizedDocuments.length > 0) {
            setCurrentDocId(authorizedDocuments[0].id);
            setDocument(authorizedDocuments[0]);
          } else {
            setDocument(null);
          }
          return;
        }
      }
      setDocument(doc);
    } else {
      setDocument(null);
    }
  }, [currentDocId, allDocuments, isUserAdmin, currentPersona?.id, authorizedDocuments.length]);

  // Save documents to localStorage for persistence
  useEffect(() => {
    try {
      localStorage.setItem('researchlab_documents', JSON.stringify(allDocuments));
    } catch {}
  }, [allDocuments]);

  // Synchronize registered members with backend API on mount
  useEffect(() => {
    fetch('/api/members')
      .then(res => res.json())
      .then((data: Collaborator[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setRegisteredMembers(prev => {
            const merged = [...data];
            for (const p of prev) {
              if (!merged.some(m => m.id === p.id || m.email.toLowerCase() === p.email.toLowerCase())) {
                merged.push(p);
              }
            }
            try {
              localStorage.setItem('researchlab_registered_members', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(err => console.warn('Could not fetch members from API:', err));
  }, []);

  // Save registered members to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('researchlab_registered_members', JSON.stringify(registeredMembers));
    } catch {}
  }, [registeredMembers]);

  // Connect CollabClient
  useEffect(() => {
    if (!currentPersona || !currentDocId) {
      clientRef.current?.destroy();
      setConnectionState('disconnected');
      return;
    }

    setRevokedMessage(null);
    clientRef.current?.destroy();

    const client = new CollabClient(
      currentDocId,
      {
        id: currentPersona.id,
        name: currentPersona.name,
        email: currentPersona.email,
        role: currentPersona.role,
        avatar: currentPersona.avatar,
        color: currentPersona.color,
      },
      {
        onSync: (doc, role) => {
          setDocument(doc);
          setCurrentUserRole(role);
          setAllDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
        },
        onRemoteUpdate: () => {
          if (clientRef.current && document) {
            const ySections = clientRef.current.yDoc.getMap<any>('sections');
            setDocument(prev => {
              if (!prev) return null;
              const updated = { ...prev };
              updated.sections = updated.sections.map(s => {
                const yText = ySections.get(s.id);
                return yText ? { ...s, content: yText.toString() } : s;
              });
              return updated;
            });
          }
        },
        onConnectionChange: setConnectionState,
        onCursorUpdate: (cursor) => {
          setCollaboratorCursors(prev => ({ ...prev, [cursor.userId]: cursor }));
        },
        onUserLeft: (userId) => {
          setCollaboratorCursors(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        },
        onUserJoined: (user) => {
          setDocument(prev => {
            if (!prev) return null;
            const exists = prev.collaborators.some(c => c.id === user.id);
            if (exists) {
              return {
                ...prev,
                collaborators: prev.collaborators.map(c => c.id === user.id ? { ...c, isOnline: true } : c)
              };
            }
            return {
              ...prev,
              collaborators: [...prev.collaborators, user as Collaborator]
            };
          });
        },
        onMetadataUpdate: (meta) => {
          setDocument(prev => prev ? ({ ...prev, ...meta }) : null);
        },
        onSectionsUpdate: (sections) => {
          setDocument(prev => prev ? ({ ...prev, sections }) : null);
        },
        onCommentUpdate: (payload) => {
          if (payload.type === 'comment-added') {
            setDocument(prev => prev ? ({ ...prev, comments: [...prev.comments, payload.comment] }) : null);
          } else if (payload.type === 'comment-replied') {
            setDocument(prev => {
              if (!prev) return null;
              return {
                ...prev,
                comments: prev.comments.map(c => c.id === payload.commentId ? {
                  ...c,
                  replies: [...c.replies, payload.reply]
                } : c)
              };
            });
          } else if (payload.type === 'comment-resolved') {
            setDocument(prev => {
              if (!prev) return null;
              return {
                ...prev,
                comments: prev.comments.map(c => c.id === payload.commentId ? {
                  ...c,
                  resolved: payload.resolved
                } : c)
              };
            });
          }
        },
        onSuggestionUpdate: (payload) => {
          if (payload.type === 'suggestion-added') {
            setDocument(prev => prev ? ({ ...prev, suggestions: [...prev.suggestions, payload.suggestion] }) : null);
          } else if (payload.type === 'suggestion-resolved') {
            setDocument(prev => {
              if (!prev) return null;
              return {
                ...prev,
                suggestions: prev.suggestions.map(s => s.id === payload.suggestionId ? {
                  ...s,
                  status: payload.status
                } : s)
              };
            });
          }
        },
        onCollaboratorsUpdate: (collaborators) => {
          setDocument(prev => prev ? ({ ...prev, collaborators }) : null);
        },
        onRoleChange: (newRole) => {
          setCurrentUserRole(newRole);
        },
        onAccessRevoked: (reason) => {
          setRevokedMessage(reason);
        },
        onVersionCreated: (version) => {
          setDocument(prev => prev ? ({ ...prev, versions: [version, ...prev.versions] }) : null);
        },
        onVersionRestored: (doc) => {
          setDocument(doc);
        },
        onReferencesUpdate: (refs) => {
          setDocument(prev => prev ? ({ ...prev, references: refs }) : null);
        },
        onDriveExportsUpdate: (payload) => {
          setDocument(prev => {
            if (!prev) return null;
            return {
              ...prev,
              driveExports: payload.driveExports || prev.driveExports,
              auditLog: payload.auditLog || prev.auditLog,
            };
          });
        },
        onPermissionDenied: (reason) => {
          alert(`Server Permission: ${reason}`);
        },
      }
    );

    clientRef.current = client;

    return () => {
      client.destroy();
    };
  }, [currentDocId, currentPersona?.id]);

  // Handle Login Event with specific platform
  const handleLoginSuccess = (user: Collaborator, type: 'admin' | 'member') => {
    setCurrentPersona(user);
    setCurrentUserRole(user.role);
    setPlatformType(type);
    setCurrentPage('dashboard');
  };

  const handleSignOut = () => {
    setCurrentPersona(null);
    setPlatformType('guest');
    setCurrentPage('login');
  };

  // Section Content Edit
  const handleUpdateSectionContent = (sectionId: string, content: string) => {
    if (!document) return;
    if (currentUserRole === 'viewer') return;
    if (currentUserRole === 'reviewer') {
      setSelectedText(content.slice(0, 50));
      setActiveTargetSectionId(sectionId);
      setIsReviewSidebarOpen(true);
      return;
    }

    setIsSaving(true);
    if (clientRef.current) {
      const ySections = clientRef.current.yDoc.getMap<any>('sections');
      let yText = ySections.get(sectionId);
      if (yText) {
        yText.delete(0, yText.length);
        yText.insert(0, content);
      }
    }

    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, content } : s),
        updatedAt: new Date().toISOString(),
      };
    });

    setTimeout(() => setIsSaving(false), 600);
  };

  const handleUpdateMetadata = (updates: Partial<ResearchDocument>) => {
    if (!document) return;
    if (currentUserRole !== 'owner' && currentUserRole !== 'editor') return;
    setDocument(prev => prev ? ({ ...prev, ...updates }) : null);
    clientRef.current?.sendMetadataUpdate(updates);
  };

  const handleCursorMove = (sectionId: string, cursorIndex: number, selection?: { start: number; end: number }) => {
    clientRef.current?.sendCursor(sectionId, cursorIndex, selection);
  };

  const handleTextSelect = (text: string, sectionId: string) => {
    setSelectedText(text);
    setActiveTargetSectionId(sectionId);
  };

  // Section Reordering
  const handleReorderSections = (newSections: any[]) => {
    if (!document) return;
    setDocument(prev => prev ? ({ ...prev, sections: newSections }) : null);
    clientRef.current?.sendSectionReorder(newSections);
  };

  const handleAddSection = (title: string, type: 'standard' | 'appendix') => {
    if (!document) return;
    const newSec = {
      id: `sec-${Date.now()}`,
      title,
      type,
      order: document.sections.length + 1,
      content: '',
    };
    setDocument(prev => prev ? ({ ...prev, sections: [...prev.sections, newSec] }) : null);
    clientRef.current?.sendSectionAdd(newSec);
    setActiveSectionId(newSec.id);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!document) return;
    if (currentUserRole !== 'owner') return;
    setDocument(prev => prev ? ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }) : null);
    clientRef.current?.sendSectionDelete(sectionId);
  };

  // Comments & Suggestions
  const handleAddComment = (content: string, selText?: string, secId?: string) => {
    if (!document || !currentPersona) return;
    const comment = {
      id: `comm-${Date.now()}`,
      sectionId: secId || activeTargetSectionId,
      selectedText: selText || selectedText,
      author: {
        id: currentPersona.id,
        name: currentPersona.name,
        avatar: currentPersona.avatar,
        role: currentUserRole,
      },
      content,
      timestamp: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    clientRef.current?.sendAddComment(comment);
    setSelectedText('');
  };

  const handleReplyComment = (commentId: string, content: string) => {
    clientRef.current?.sendReplyComment(commentId, content);
  };

  const handleResolveComment = (commentId: string, resolved: boolean) => {
    clientRef.current?.sendResolveComment(commentId, resolved);
  };

  const handleAddSuggestion = (originalText: string, suggestedText: string, sectionId: string) => {
    clientRef.current?.sendAddSuggestion({
      sectionId: sectionId || activeTargetSectionId,
      originalText,
      suggestedText,
    });
    setSelectedText('');
  };

  const handleResolveSuggestion = (suggestionId: string, status: 'accepted' | 'rejected') => {
    clientRef.current?.sendResolveSuggestion(suggestionId, status);
  };

  // Roles & Permissions
  const handleUpdateCollaboratorRole = (userId: string, newRole: DocumentRole) => {
    // 1. Update in registeredMembers state
    setRegisteredMembers(prev =>
      prev.map(m => (m.id === userId ? { ...m, role: newRole } : m))
    );

    // 2. Persist to server backend
    fetch('/api/members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, role: newRole }),
    }).catch(e => console.warn('Failed to update member role on backend:', e));

    // 3. Update across all documents
    setAllDocuments(docs =>
      docs.map(d => ({
        ...d,
        collaborators: d.collaborators.map(c => (c.id === userId ? { ...c, role: newRole } : c)),
      }))
    );

    if (document) {
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          collaborators: prev.collaborators.map(c => (c.id === userId ? { ...c, role: newRole } : c)),
        };
      });
      clientRef.current?.sendUpdateRole(userId, newRole);
    }
  };

  // Remove collaborator access from this specific paper ONLY (DOES NOT delete the user account)
  const handleRemoveCollaboratorFromDocument = (userId: string) => {
    if (document) {
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          collaborators: prev.collaborators.filter(c => c.id !== userId),
        };
      });

      setAllDocuments(docs =>
        docs.map(d =>
          d.id === document.id
            ? { ...d, collaborators: d.collaborators.filter(c => c.id !== userId) }
            : d
        )
      );

      clientRef.current?.sendRevokeCollaborator(userId);
    }
  };

  // Deregister researcher completely from the Laboratory Directory (Admin only in Team page)
  const handleDeregisterLabMember = (userId: string) => {
    if (userId === 'user-sunil' || userId === ADMIN_USER.id) {
      alert('Cannot revoke the Principal Investigator.');
      return;
    }

    // 1. Remove from registeredMembers state & localStorage
    setRegisteredMembers(prev => prev.filter(m => m.id !== userId));

    // 2. Remove from backend persistent disk
    fetch(`/api/members?id=${userId}`, { method: 'DELETE' }).catch(e =>
      console.warn('Failed to delete member on backend:', e)
    );

    // 3. Remove this user from all documents they were attached to
    setAllDocuments(docs =>
      docs.map(d => ({
        ...d,
        collaborators: d.collaborators.filter(c => c.id !== userId),
      }))
    );

    if (document) {
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          collaborators: prev.collaborators.filter(c => c.id !== userId),
        };
      });
      clientRef.current?.sendRevokeCollaborator(userId);
    }
  };

  // Delete Research Manuscript (Admin only)
  const handleDeleteManuscript = (docId: string) => {
    if (!isUserAdmin) {
      alert('Only the laboratory administrator can delete research manuscripts.');
      return;
    }

    // 1. Remove from allDocuments state & localStorage
    setAllDocuments(prev => prev.filter(d => d.id !== docId));

    // 2. Remove from server backend
    fetch(`/api/documents?id=${docId}`, { method: 'DELETE' }).catch(e =>
      console.warn('Failed to delete manuscript on backend:', e)
    );

    // 3. If currently selected document is deleted, switch or reset
    if (currentDocId === docId) {
      const remaining = allDocuments.filter(d => d.id !== docId);
      if (remaining.length > 0) {
        setCurrentDocId(remaining[0].id);
        setDocument(remaining[0]);
      } else {
        setCurrentDocId('');
        setDocument(null);
      }
    }
  };

  const handleTransferOwnership = (newOwnerId: string) => {
    clientRef.current?.sendTransferOwnership(newOwnerId);
  };

  // Add Collaborator (Only Admin can add members)
  const handleAddCollaborator = (collab: Collaborator, initialDocIds?: string[]) => {
    // 1. Save to registeredMembers for login & team directory
    setRegisteredMembers(prev => {
      const exists = prev.some(
        m => m.id === collab.id || m.email.toLowerCase() === collab.email.toLowerCase()
      );
      const updated = exists
        ? prev.map(m =>
            m.id === collab.id || m.email.toLowerCase() === collab.email.toLowerCase()
              ? collab
              : m
          )
        : [...prev, collab];
      return updated;
    });

    // 2. Persist to server backend
    fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collab),
    }).catch(e => console.warn('Failed to sync member to backend:', e));

    // 3. Assign to selected manuscripts or current document
    const targetDocIds =
      initialDocIds && initialDocIds.length > 0
        ? initialDocIds
        : document
        ? [document.id]
        : [];

    if (targetDocIds.length > 0) {
      setAllDocuments(docs =>
        docs.map(d => {
          if (targetDocIds.includes(d.id)) {
            const hasCollab = d.collaborators.some(
              c => c.id === collab.id || c.email.toLowerCase() === collab.email.toLowerCase()
            );
            if (!hasCollab) {
              return { ...d, collaborators: [...d.collaborators, collab] };
            }
          }
          return d;
        })
      );

      if (document && targetDocIds.includes(document.id)) {
        setDocument(prev =>
          prev
            ? {
                ...prev,
                collaborators: prev.collaborators.some(c => c.id === collab.id)
                  ? prev.collaborators
                  : [...prev.collaborators, collab],
              }
            : null
        );
        clientRef.current?.sendAddCollaborator(collab);
      }
    }
  };

  // Toggle Member Assignment to a Document
  const handleToggleDocAssignment = (userId: string, docId: string) => {
    const member = registeredMembers.find(m => m.id === userId);
    if (!member) return;

    setAllDocuments(docs =>
      docs.map(d => {
        if (d.id === docId) {
          const exists = d.collaborators.some(
            c => c.id === userId || c.email.toLowerCase() === member.email.toLowerCase()
          );
          const updatedCollabs = exists
            ? d.collaborators.filter(
                c => c.id !== userId && c.email.toLowerCase() !== member.email.toLowerCase()
              )
            : [...d.collaborators, member];
          return { ...d, collaborators: updatedCollabs };
        }
        return d;
      })
    );

    if (document && document.id === docId) {
      const exists = document.collaborators.some(
        c => c.id === userId || c.email.toLowerCase() === member.email.toLowerCase()
      );
      if (exists) {
        setDocument(prev =>
          prev
            ? {
                ...prev,
                collaborators: prev.collaborators.filter(
                  c => c.id !== userId && c.email.toLowerCase() !== member.email.toLowerCase()
                ),
              }
            : null
        );
        clientRef.current?.sendRevokeCollaborator(userId);
      } else {
        setDocument(prev =>
          prev
            ? {
                ...prev,
                collaborators: [...prev.collaborators, member],
              }
            : null
        );
        clientRef.current?.sendAddCollaborator(member);
      }
    }
  };

  const handleToggleArchive = () => {
    if (!document) return;
    const nextArchived = !document.isArchived;
    setDocument(prev => prev ? ({ ...prev, isArchived: nextArchived }) : null);
    clientRef.current?.sendMetadataUpdate({ isArchived: nextArchived });
  };

  // Equations, Figures, Tables
  const handleSaveEquation = (eq: PaperEquation) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === activeTargetSectionId) {
            const eqs = s.equations ? [...s.equations] : [];
            const idx = eqs.findIndex(e => e.id === eq.id);
            if (idx !== -1) eqs[idx] = eq;
            else eqs.push(eq);
            return { ...s, equations: eqs };
          }
          return s;
        })
      };
    });
  };

  const handleDeleteEquation = (sectionId: string, eqId: string) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? {
          ...s,
          equations: s.equations?.filter(e => e.id !== eqId)
        } : s)
      };
    });
  };

  const handleSaveFigure = (fig: PaperFigure) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === activeTargetSectionId) {
            return { ...s, figures: [...(s.figures || []), fig] };
          }
          return s;
        })
      };
    });
  };

  const handleDeleteFigure = (sectionId: string, figId: string) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? {
          ...s,
          figures: s.figures?.filter(f => f.id !== figId)
        } : s)
      };
    });
  };

  const handleSaveTable = (tbl: PaperTable) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === activeTargetSectionId) {
            return { ...s, tables: [...(s.tables || []), tbl] };
          }
          return s;
        })
      };
    });
  };

  const handleDeleteTable = (sectionId: string, tblId: string) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? {
          ...s,
          tables: s.tables?.filter(t => t.id !== tblId)
        } : s)
      };
    });
  };

  // References
  const handleAddReference = (ref: ReferenceItem) => {
    clientRef.current?.sendAddReference(ref);
  };

  const handleUpdateReference = (ref: ReferenceItem) => {
    clientRef.current?.sendUpdateReference(ref);
  };

  const handleDeleteReference = (refId: string) => {
    clientRef.current?.sendDeleteReference(refId);
  };

  const handleInsertCitation = (key: string, index: number) => {
    if (!document) return;
    const citationTag = ` [${index}]`;
    const sec = document.sections.find(s => s.id === activeTargetSectionId) || document.sections[0];
    if (sec) {
      handleUpdateSectionContent(sec.id, sec.content + citationTag);
    }
  };

  // Google Drive Cited Literature PDF attachment handler
  const handleSavePdfAttachment = (referenceId: string, attachment: ReferencePdfAttachment | null) => {
    if (!document) return;
    const updatedReferences = document.references.map(r => {
      if (r.id === referenceId) {
        return { ...r, pdfAttachment: attachment || undefined };
      }
      return r;
    });

    const targetRef = updatedReferences.find(r => r.id === referenceId);

    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        references: updatedReferences,
        auditLog: [
          {
            id: `log-${Date.now()}`,
            action: attachment ? 'Attached Cited PDF to Google Drive' : 'Unlinked Cited PDF',
            actorName: currentPersona?.name || 'Researcher',
            actorRole: currentUserRole,
            timestamp: new Date().toISOString(),
            details: attachment
              ? `Uploaded ${attachment.fileName} to Google Drive folder 'CollabScholar - Cited Literature PDFs'`
              : `Removed PDF attachment for reference ${targetRef?.key || referenceId}`,
          },
          ...prev.auditLog,
        ],
      };
    });

    setAllDocuments(docs =>
      docs.map(d =>
        d.id === document.id
          ? { ...d, references: updatedReferences }
          : d
      )
    );

    if (targetRef) {
      clientRef.current?.sendUpdateReference(targetRef);
    }
  };

  // Version Snapshots
  const handleCreateSnapshot = (versionNumber: string, label: string, summary: string) => {
    clientRef.current?.sendCreateVersion(versionNumber, label, summary);
  };

  const handleRestoreVersion = (versionId: string) => {
    clientRef.current?.sendRestoreVersion(versionId);
  };

  // Google Drive Export
  const handleRecordDriveExport = (record: DriveExportRecord) => {
    clientRef.current?.send({
      type: 'drive-export-recorded',
      exportRecord: record,
    });
  };

  // Export DOCX
  const handleExportDocx = async () => {
    if (!document) return;
    try {
      const blob = await generateDocxBlob(document);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
      a.click();
    } catch (e) {
      console.error(e);
      alert('Failed to generate DOCX file.');
    }
  };

  // Export PDF (Print dialog with page styling)
  const handleExportPdf = () => {
    window.print();
  };

  // Fresh Start: Create New Research Manuscript
  const handleCreateNewManuscript = (
    docType: 'journal' | 'conference' | 'lit_review' | 'technical_report',
    title: string
  ) => {
    const newDoc: ResearchDocument = {
      id: `doc-${Date.now()}`,
      projectId: 'proj-researchlab',
      docType,
      title: title || 'Untitled Research Manuscript',
      abstract: '',
      keywords: [],
      citationStyle: 'ieee',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authors: [
        {
          id: 'auth-sunil',
          name: 'Sunil Paudel',
          email: 'sunil@researchlab.np',
          affiliation: 'ResearchLab Directorate',
          isCorresponding: true,
        }
      ],
      collaborators: [currentPersona || ADMIN_USER],
      sections: [
        {
          id: 'sec-intro',
          title: '1. Introduction',
          type: 'standard',
          order: 1,
          content: 'Write introduction, research motivation, and core problem statement here...',
        },
        {
          id: 'sec-lit-review',
          title: '2. Literature Review',
          type: 'standard',
          order: 2,
          content: 'Review prior academic literature and theoretical foundations...',
        },
        {
          id: 'sec-methodology',
          title: '3. Research Methodology',
          type: 'standard',
          order: 3,
          content: 'Formulate hypotheses, experimental setups, or formal mathematical models...',
        },
        {
          id: 'sec-results',
          title: '4. Results & Discussion',
          type: 'standard',
          order: 4,
          content: 'Present experimental benchmarks, figures, and comparative discussion...',
        },
        {
          id: 'sec-conclusion',
          title: '5. Conclusion',
          type: 'standard',
          order: 5,
          content: 'Summarize principal contributions and propose future research directions...',
        }
      ],
      references: [],
      comments: [],
      suggestions: [],
      versions: [
        {
          id: `ver-${Date.now()}`,
          versionNumber: '1.0',
          label: 'Initial Manuscript Creation',
          summary: 'Initialized publication draft in ResearchLab workspace.',
          authorName: currentPersona?.name || 'Sunil Paudel',
          authorAvatar: currentPersona?.avatar || ADMIN_USER.avatar,
          timestamp: new Date().toISOString(),
          data: {
            title: title || 'Untitled Research Manuscript',
            abstract: '',
            keywords: [],
            authors: [],
            sections: [],
            references: [],
            stats: { words: 0, characters: 0 }
          }
        }
      ],
      driveExports: [],
      auditLog: [
        {
          id: `log-${Date.now()}`,
          action: 'Manuscript Created',
          actorName: currentPersona?.name || 'Sunil Paudel',
          actorRole: currentUserRole,
          timestamp: new Date().toISOString(),
          details: 'Initialized publication draft in ResearchLab directorate.'
        }
      ]
    };

    setAllDocuments(prev => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
    setDocument(newDoc);
    setCurrentPage('editor');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 text-stone-900 font-sans">
      {/* 1. UNIVERSAL NAVIGATION BAR */}
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentPersona}
        platformType={platformType}
        onSignOut={handleSignOut}
        activeDocTitle={document?.title}
      />

      {/* 2. PUBLIC / OVERVIEW LANDING PAGE */}
      {currentPage === 'landing' && (
        <div className="flex-1 overflow-y-auto">
          <LandingPage
            onOpenEditor={() => {
              if (currentPersona) {
                setCurrentPage(allDocuments.length > 0 ? 'editor' : 'dashboard');
              } else {
                setCurrentPage('login');
              }
            }}
            onOpenDashboard={() => {
              if (currentPersona) {
                setCurrentPage('dashboard');
              } else {
                setCurrentPage('login');
              }
            }}
            onOpenLogin={() => setCurrentPage('login')}
          />
        </div>
      )}

      {/* 3. DEDICATED AUTHENTICATION GATEWAY */}
      {currentPage === 'login' && (
        <div className="flex-1 overflow-y-auto">
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateHome={() => setCurrentPage('landing')}
            registeredMembers={registeredMembers}
          />
        </div>
      )}

      {/* 4. MANUSCRIPTS & PROJECTS HUB */}
      {currentPage === 'dashboard' && (
        <div className="flex-1 overflow-y-auto">
          <ProjectsDashboard
            documents={allDocuments}
            currentDocId={currentDocId}
            onSelectDoc={(id) => {
              setCurrentDocId(id);
              const doc = allDocuments.find(d => d.id === id);
              if (doc) setDocument(doc);
            }}
            onOpenEditor={() => setCurrentPage('editor')}
            onCreateNewDoc={handleCreateNewManuscript}
            onOpenDriveModal={(doc) => {
              setDocument(doc);
              setIsDriveModalOpen(true);
            }}
            onOpenShareModal={(doc) => {
              setDocument(doc);
              setIsShareModalOpen(true);
            }}
            onDeleteDoc={handleDeleteManuscript}
            currentUser={currentPersona}
            platformType={platformType}
          />
        </div>
      )}

      {/* 5. REFERENCES & CITATIONS CATALOG */}
      {currentPage === 'references' && (
        <div className="flex-1 overflow-y-auto">
          <ReferencesPage
            references={document ? document.references : []}
            citationStyle={document ? document.citationStyle : 'ieee'}
            onUpdateStyle={(style) => handleUpdateMetadata({ citationStyle: style })}
            onOpenImportModal={() => setIsReferenceModalOpen(true)}
            onDeleteReference={handleDeleteReference}
            onOpenAttachPdf={(ref, idx) => setAttachPdfTarget({ ref, index: idx })}
          />
        </div>
      )}

      {/* 6. TEAM & ACCESS CONTROL (Admin Matrix vs Member Directory) */}
      {currentPage === 'team' && (
        <div className="flex-1 overflow-y-auto">
          <TeamPage
            members={registeredMembers}
            allDocuments={allDocuments}
            auditLog={document ? document.auditLog : []}
            currentUserRole={currentUserRole}
            currentUserId={currentPersona?.id || ''}
            platformType={platformType}
            onUpdateRole={handleUpdateCollaboratorRole}
            onRevokeAccess={handleDeregisterLabMember}
            onTransferOwnership={handleTransferOwnership}
            onAddCollaborator={handleAddCollaborator}
            onToggleDocAssignment={handleToggleDocAssignment}
          />
        </div>
      )}

      {/* 7. REAL-TIME COLLABORATIVE PAPER EDITOR */}
      {currentPage === 'editor' && (
        !document ? (
          <div className="flex-1 bg-stone-100 flex items-center justify-center p-8">
            <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">
                No Active Manuscript Loaded
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {platformType === 'admin'
                  ? 'Your ResearchLab directorate is clean and ready. Initialize your first research paper to begin writing with real-time CRDT collaboration.'
                  : 'You have not been assigned to any research papers yet. Please contact the administrator (sunil@researchlab.np).'}
              </p>
              <div className="pt-2 flex justify-center space-x-3">
                {platformType === 'admin' ? (
                  <button
                    onClick={() => handleCreateNewManuscript('journal', 'Untitled Research Manuscript')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Manuscript</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold"
                  >
                    View Manuscripts Hub
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : revokedMessage || (!isUserAdmin && !authorizedDocuments.some(d => d.id === currentDocId)) ? (
          <div className="flex-1 bg-stone-100 flex items-center justify-center p-8">
            <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Access Restricted by Administrator
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {revokedMessage || 'You have not been added as a collaborator to this manuscript by the laboratory administrator. Members can only access the papers to which they have been explicitly assigned.'}
              </p>
              <div className="pt-2 flex justify-center space-x-3">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  View My Assigned Manuscripts
                </button>
                {authorizedDocuments.length > 0 && (
                  <button
                    onClick={() => setCurrentDocId(authorizedDocuments[0].id)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold"
                  >
                    Open Assigned Paper
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <EditorHeader
              document={document}
              currentUserId={currentPersona?.id || ''}
              currentUserRole={currentUserRole}
              connectionState={connectionState}
              collaborators={document.collaborators}
              isSaving={isSaving}
              isSplitView={isSplitViewOpen}
              layoutMode={layoutMode}
              fontFamily={fontFamily}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              onToggleSplitView={() => setIsSplitViewOpen(!isSplitViewOpen)}
              onToggleLayoutMode={() => setLayoutMode(layoutMode === 'single' ? 'two-column' : 'single')}
              onSetFontFamily={setFontFamily}
              onSetFontSize={setFontSize}
              onSetLineSpacing={setLineSpacing}
              onSwitchPersona={(p) => {
                setCurrentPersona(p);
                setCurrentUserRole(p.role);
              }}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onOpenVersionModal={() => setIsVersionModalOpen(true)}
              onOpenReferenceModal={() => setIsReferenceModalOpen(true)}
              onOpenDriveModal={() => setIsDriveModalOpen(true)}
              onOpenEquationModal={() => {
                setEditingEquation(null);
                setIsEquationModalOpen(true);
              }}
              onOpenFigureModal={() => setIsFigureModalOpen(true)}
              onOpenTableModal={() => setIsTableModalOpen(true)}
              onToggleFindReplace={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
              onExportDocx={handleExportDocx}
              onExportPdf={handleExportPdf}
            />

            <FindReplaceBar
              isOpen={isFindReplaceOpen}
              onClose={() => setIsFindReplaceOpen(false)}
              onFind={(term, caseSens) => {
                if (!term || !document) return 0;
                let count = 0;
                const flags = caseSens ? 'g' : 'gi';
                const regex = new RegExp(term, flags);
                for (const sec of document.sections) {
                  const matches = sec.content.match(regex);
                  if (matches) count += matches.length;
                }
                return count;
              }}
              onReplace={(findTerm, replaceTerm, replaceAll, caseSens) => {
                if (!findTerm || !document) return;
                const flags = caseSens ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
                const regex = new RegExp(findTerm, flags);
                const updatedSections = document.sections.map(sec => {
                  if (regex.test(sec.content)) {
                    const nextContent = sec.content.replace(regex, replaceTerm);
                    handleUpdateSectionContent(sec.id, nextContent);
                    return { ...sec, content: nextContent };
                  }
                  return sec;
                });
                setDocument(prev => prev ? ({ ...prev, sections: updatedSections }) : null);
              }}
            />

            <div className="flex-1 flex overflow-hidden relative">
              <OutlineSidebar
                sections={document.sections}
                activeSectionId={activeSectionId}
                userRole={currentUserRole}
                currentDocId={currentDocId}
                onSelectSection={setActiveSectionId}
                onReorderSections={handleReorderSections}
                onAddSection={handleAddSection}
                onDeleteSection={handleDeleteSection}
                onSelectDocument={setCurrentDocId}
                allDocs={authorizedDocuments.map(d => ({ id: d.id, title: d.title, docType: d.docType }))}
                onCreateNewDoc={() => handleCreateNewManuscript('conference', 'Untitled Conference Paper')}
              />

              <DocumentCanvas
                document={document}
                userRole={currentUserRole}
                currentUserId={currentPersona?.id || ''}
                activeSectionId={activeSectionId}
                collaboratorCursors={collaboratorCursors}
                layoutMode={layoutMode}
                fontFamily={fontFamily}
                fontSize={fontSize}
                lineSpacing={lineSpacing}
                highlightedText={selectedText}
                onUpdateSectionContent={handleUpdateSectionContent}
                onUpdateMetadata={handleUpdateMetadata}
                onCursorMove={handleCursorMove}
                onTextSelect={handleTextSelect}
                onOpenEquationModal={(secId, eq) => {
                  setActiveTargetSectionId(secId);
                  setEditingEquation(eq || null);
                  setIsEquationModalOpen(true);
                }}
                onOpenFigureModal={(secId) => {
                  setActiveTargetSectionId(secId);
                  setIsFigureModalOpen(true);
                }}
                onOpenTableModal={(secId) => {
                  setActiveTargetSectionId(secId);
                  setIsTableModalOpen(true);
                }}
                onOpenReferenceManager={() => setIsReferenceModalOpen(true)}
                onOpenAttachPdf={(ref, idx) => setAttachPdfTarget({ ref, index: idx })}
                onDeleteEquation={handleDeleteEquation}
                onDeleteFigure={handleDeleteFigure}
                onDeleteTable={handleDeleteTable}
              />

              <ReviewSidebar
                isOpen={isReviewSidebarOpen}
                onClose={() => setIsReviewSidebarOpen(false)}
                comments={document.comments}
                suggestions={document.suggestions}
                collaborators={document.collaborators}
                currentUserId={currentPersona?.id || ''}
                userRole={currentUserRole}
                selectedText={selectedText}
                activeSectionId={activeTargetSectionId}
                onAddComment={handleAddComment}
                onReplyComment={handleReplyComment}
                onResolveComment={handleResolveComment}
                onAddSuggestion={handleAddSuggestion}
                onResolveSuggestion={handleResolveSuggestion}
              />
            </div>
          </div>
        )
      )}

      {/* Global Modals (Only active when document exists) */}
      {document && (
        <>
          <EquationModal
            isOpen={isEquationModalOpen}
            onClose={() => {
              setIsEquationModalOpen(false);
              setEditingEquation(null);
            }}
            onSave={handleSaveEquation}
            initialEquation={editingEquation}
            nextNumber={
              document.sections.reduce((acc, s) => acc + (s.equations ? s.equations.length : 0), 0) + 1
            }
          />

          <FigureTableModal
            isOpen={isFigureModalOpen}
            onClose={() => setIsFigureModalOpen(false)}
            type="figure"
            sectionId={activeTargetSectionId}
            nextNumber={
              document.sections.reduce((acc, s) => acc + (s.figures ? s.figures.length : 0), 0) + 1
            }
            onSaveFigure={handleSaveFigure}
            onSaveTable={handleSaveTable}
          />

          <FigureTableModal
            isOpen={isTableModalOpen}
            onClose={() => setIsTableModalOpen(false)}
            type="table"
            sectionId={activeTargetSectionId}
            nextNumber={
              document.sections.reduce((acc, s) => acc + (s.tables ? s.tables.length : 0), 0) + 1
            }
            onSaveFigure={handleSaveFigure}
            onSaveTable={handleSaveTable}
          />

          <ReferenceManagerModal
            isOpen={isReferenceModalOpen}
            onClose={() => setIsReferenceModalOpen(false)}
            references={document.references}
            citationStyle={document.citationStyle}
            onUpdateStyle={(style) => handleUpdateMetadata({ citationStyle: style })}
            onAddReference={handleAddReference}
            onUpdateReference={handleUpdateReference}
            onDeleteReference={handleDeleteReference}
            onInsertCitation={handleInsertCitation}
            onOpenAttachPdf={(ref, idx) => setAttachPdfTarget({ ref, index: idx })}
          />

          <VersionHistoryModal
            isOpen={isVersionModalOpen}
            onClose={() => setIsVersionModalOpen(false)}
            versions={document.versions}
            auditLog={document.auditLog}
            currentDoc={document}
            userRole={currentUserRole}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreVersion={handleRestoreVersion}
          />

          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            collaborators={document.collaborators}
            currentUserId={currentPersona?.id || ''}
            currentUserRole={currentUserRole}
            isArchived={document.isArchived}
            onUpdateRole={handleUpdateCollaboratorRole}
            onRevokeAccess={handleRemoveCollaboratorFromDocument}
            onTransferOwnership={handleTransferOwnership}
            onToggleArchive={handleToggleArchive}
            onAddCollaborator={handleAddCollaborator}
            registeredMembers={registeredMembers}
          />

          <DriveExportModal
            isOpen={isDriveModalOpen}
            onClose={() => setIsDriveModalOpen(false)}
            document={document}
            onRecordExport={handleRecordDriveExport}
          />

          <SplitCollabView
            isOpen={isSplitViewOpen}
            onClose={() => setIsSplitViewOpen(false)}
            docId={currentDocId}
          />
        </>
      )}

      {/* Google Drive PDF Attachment Modal */}
      <AttachPdfModal
        isOpen={Boolean(attachPdfTarget)}
        onClose={() => setAttachPdfTarget(null)}
        reference={attachPdfTarget?.ref || null}
        citationIndex={attachPdfTarget?.index}
        currentUser={currentPersona}
        onSaveAttachment={handleSavePdfAttachment}
      />
    </div>
  );
}
