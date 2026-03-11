import React, { createContext, useState, useContext } from 'react';

const InvitationContext = createContext(null);

export const useInvitations = () => {
  const context = useContext(InvitationContext);
  if (!context) {
    throw new Error('useInvitations must be used within InvitationProvider');
  }
  return context;
};

export const InvitationProvider = ({ children }) => {
  const [invitations, setInvitations] = useState([]);

  const sendAdminInvitation = (email, senderEmail) => {
    const newInvitation = {
      id: Date.now(),
      email: email,
      role: 'admin',
      status: 'pending',
      sentBy: senderEmail,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      token: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setInvitations(prev => [newInvitation, ...prev]);
    
    // Simulate sending email
    console.log(`📧 Invitation email sent to ${email}`);
    
    return newInvitation;
  };

  const acceptInvitation = (token, userId) => {
    setInvitations(prev =>
      prev.map(inv =>
        inv.token === token
          ? { ...inv, status: 'accepted', acceptedAt: new Date(), acceptedBy: userId }
          : inv
      )
    );
  };

  const revokeInvitation = (id) => {
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, status: 'revoked', revokedAt: new Date() } : inv
      )
    );
  };

  const resendInvitation = (id) => {
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === id
          ? {
              ...inv,
              sentAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
          : inv
      )
    );
  };

  const getInvitationByToken = (token) => {
    return invitations.find(inv => inv.token === token);
  };

  const isTokenValid = (token) => {
    const invitation = getInvitationByToken(token);
    if (!invitation) return false;
    if (invitation.status !== 'pending') return false;
    return new Date() < new Date(invitation.expiresAt);
  };

  const value = {
    invitations,
    sendAdminInvitation,
    acceptInvitation,
    revokeInvitation,
    resendInvitation,
    getInvitationByToken,
    isTokenValid,
  };

  return (
    <InvitationContext.Provider value={value}>
      {children}
    </InvitationContext.Provider>
  );
};
