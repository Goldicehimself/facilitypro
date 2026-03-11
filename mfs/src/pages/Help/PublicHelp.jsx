import React from 'react';
import {
  BookOpen,
  Building2,
  KeyRound,
  Mail,
  MessageCircle,
  Users,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PublicHelp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: "var(--mp-brand)" }}>
              <Building2 size={18} />
            </div>
            <span className="font-semibold text-slate-900">FacilityPro Help</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
            <Button className="rounded-full px-5" style={{ backgroundColor: "var(--mp-brand)", color: "#fff" }} onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold">Help & Support</h1>
            <p className="mt-3 text-slate-600">
              Getting started with FacilityPro and answers for new teams.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <BookOpen size={18} />
                  <h2 className="text-lg font-semibold">Getting Started Overview</h2>
                </div>
                <div className="text-sm text-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Create your organisation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Verify your email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Invite your team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Add assets and create your first work order</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Building2 size={18} />
                  <h2 className="text-lg font-semibold">Create an Organisation</h2>
                </div>
                <div className="text-sm text-slate-700 space-y-2">
                  <div>1. Go to the registration page</div>
                  <div>2. Select “Create Organisation”</div>
                  <div>3. Enter company details and admin info</div>
                  <div>4. You’ll receive an organisation code</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <KeyRound size={18} />
                  <h2 className="text-lg font-semibold">Join with Org Code</h2>
                </div>
                <div className="text-sm text-slate-700 space-y-2">
                  <div>1. Create your account</div>
                  <div>2. Enter the organisation code</div>
                  <div>3. You will join as a Staff member</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Users size={18} />
                  <h2 className="text-lg font-semibold">How Invites Work</h2>
                </div>
                <div className="text-sm text-slate-700 space-y-2">
                  <div>1. Admin or Facility Manager creates an invite</div>
                  <div>2. Invite link sets role automatically</div>
                  <div>3. User signs up and joins the organisation</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Users size={18} />
                  <h2 className="text-lg font-semibold">Roles Explained</h2>
                </div>
                <div className="text-sm text-slate-700 space-y-2">
                  <div><strong>Admin</strong> — Manage users, settings, work orders</div>
                  <div><strong>Facility Manager</strong> — Oversee operations and teams</div>
                  <div><strong>Technician</strong> — Complete assigned work</div>
                  <div><strong>Staff</strong> — Create service requests</div>
                  <div><strong>Vendor</strong> — Limited portal access</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <HelpCircle size={18} />
                  <h2 className="text-lg font-semibold">FAQs</h2>
                </div>
                <div className="text-sm text-slate-700 space-y-3">
                  <div>
                    <div className="font-semibold">How do I invite my team?</div>
                    <div>Admins and Facility Managers can send invites from the admin area.</div>
                  </div>
                  <div>
                    <div className="font-semibold">What if the org code is shared publicly?</div>
                    <div>Admins can regenerate it in Settings.</div>
                  </div>
                  <div>
                    <div className="font-semibold">Can I change someone’s role?</div>
                    <div>Yes, admins can update roles from user management.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Mail size={18} />
                  <h2 className="text-lg font-semibold">Contact Support</h2>
                </div>
                <p className="text-sm text-slate-600">Email us for onboarding help.</p>
                <p className="text-sm font-semibold text-slate-900">support@facilitypro.com</p>
                <p className="text-xs text-slate-500">TODO: replace with your support email</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <MessageCircle size={18} />
                  <h2 className="text-lg font-semibold">Community</h2>
                </div>
                <p className="text-sm text-slate-600">Ask questions and learn from others.</p>
                <Button variant="outline" className="w-full">Join community</Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <BookOpen size={18} />
                  <h2 className="text-lg font-semibold">Docs</h2>
                </div>
                <p className="text-sm text-slate-600">Guides for setup and daily use.</p>
                <Button variant="outline" className="w-full">Open docs</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicHelp;
