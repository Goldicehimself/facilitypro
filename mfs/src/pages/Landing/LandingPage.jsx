import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ClipboardList,
  Wrench,
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { PRICING_PLANS, formatNgnParts } from '../../data/pricing';

// Optimized variants created by tools/generate-screenshots.js
const CalendarWebpSrcSet = [480,768,1024,1440].map(w => `${new URL(`../../assets/screenshots/optimized/2-2-calendar-png-image-${w}.webp`, import.meta.url).href} ${w}w`).join(', ');
const CalendarPngFallback = new URL('../../assets/screenshots/optimized/2-2-calendar-png-image-768.png', import.meta.url).href;
const CalendarLarge = new URL('../../assets/screenshots/optimized/2-2-calendar-png-image-1440.png', import.meta.url).href;

const MainImageSrcSet = [640, 960, 1280, 1600]
  .map((w) => `/media/optimized/main-image-${w}.webp ${w}w`)
  .join(', ');
const CenterImageSrcSet = [640, 960, 1280, 1600]
  .map((w) => `/media/optimized/center-image-${w}.webp ${w}w`)
  .join(', ');

const LandingPage = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workOrderStatus, setWorkOrderStatus] = useState('in_progress');

  useEffect(() => {
    const timer = setInterval(() => {
      setWorkOrderStatus((prev) => (prev === 'in_progress' ? 'completed' : 'in_progress'));
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const workOrderStatusLabel = workOrderStatus === 'completed' ? 'Completed' : 'In progress';
  const workOrderStatusClass = workOrderStatus === 'completed'
    ? 'text-emerald-700 bg-emerald-100'
    : 'text-amber-700 bg-amber-100';

 // Parallax motion values
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  // ✅ ADDED: spring smoothing (professional feel)
  const mouseX = useSpring(rawMouseX, { stiffness: 120, damping: 20 });
  const mouseY = useSpring(rawMouseY, { stiffness: 120, damping: 20 });

  const dashboardX = useTransform(mouseX, v => v * -0.04);
  const dashboardY = useTransform(mouseY, v => v * -0.03);

  const calendarX = useTransform(mouseX, v => v * -0.08);
  const calendarY = useTransform(mouseY, v => v * -0.05);

  const workX = useTransform(mouseX, v => v * 0.06);
  const workY = useTransform(mouseY, v => v * 0.04);

  const handleMouseMove = (e) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawMouseX.set((e.clientX - rect.left - rect.width / 2) * 0.6); // ✅ ADDED damping
    rawMouseY.set((e.clientY - rect.top - rect.height / 2) * 0.6);
  };

  const handleMouseLeave = () => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  };

  const roles = [
    "Facility Managers",
    "Technicians",
    "Vendors",
    "Staff",
    "Finance Teams",
  ];

  const featureHighlights = [
    { icon: ClipboardList, title: "Work Orders", desc: "Create, assign, and track work orders with full visibility." },
    { icon: CalendarDays, title: "Preventive Maintenance", desc: "Schedule PMs and reduce downtime with automated reminders." },
    { icon: Wrench, title: "Asset Lifecycle", desc: "Track assets, warranties, and service history in one place." },
    { icon: Users, title: "Vendor Management", desc: "Manage vendors, contracts, and performance metrics." },
    { icon: BarChart3, title: "Reporting", desc: "Dashboards for costs, SLA performance, and trends." },
    { icon: ShieldCheck, title: "Security", desc: "Role-based access and audit-ready workflows." },
  ];

  const howItWorks = [
    { step: "01", title: "Set up your org", desc: "Create your organization and invite your team." },
    { step: "02", title: "Add assets and locations", desc: "Import assets and define facilities with ease." },
    { step: "03", title: "Run maintenance", desc: "Submit work orders and monitor progress end-to-end." },
    { step: "04", title: "Optimize performance", desc: "Use analytics to reduce downtime and control costs." },
  ];

  const testimonials = [
    {
      name: "Ayo B.",
      role: "Facility Manager, Nova Logistics",
      quote: "We cut response time by 40% within the first month. The dashboards are clear and the team loves it."
    },
    {
      name: "Diana K.",
      role: "Operations Lead, Beacon Hospitals",
      quote: "The preventive maintenance calendar alone paid for itself. Our equipment uptime is the best it has been."
    },
    {
      name: "Michael J.",
      role: "Finance Director, Crest Foods",
      quote: "Cost tracking and approvals are finally centralized. Monthly reporting is now a 10-minute job."
    },
  ];

  const integrations = [
    "Email",
    "Slack",
    "Microsoft Teams",
    "Zapier",
    "Google Calendar",
    "SharePoint",
  ];

  const faqs = [
    {
      q: "Is there a free trial?",
      a: "Yes. Every account starts with a 14-day free trial. No credit card required."
    },
    {
      q: "Can I invite my whole team?",
      a: "Yes. Invite as many users as you need. Seats scale by plan."
    },
    {
      q: "Do you support multiple locations?",
      a: "Yes. You can manage multiple facilities and locations in a single account."
    },
    {
      q: "Is my data secure?",
      a: "We use role-based access and secure infrastructure to keep your data protected."
    },
  ];

  const stats = [
    { label: "faster response time", value: "42%" },
    { label: "reduction in equipment downtime", value: "30%" },
    { label: "work order visibility", value: "100%" },
    { label: "Rated by facility teams", value: "4.8/5" },
  ];


  const roleHighlights = [
    {
      icon: Building2,
      title: "Facility Managers",
      desc: "Centralize work orders, PM schedules, and asset history."
    },
    {
      icon: Wrench,
      title: "Technicians",
      desc: "Get clear assignments, checklists, and time tracking."
    },
    {
      icon: Users,
      title: "Vendors",
      desc: "Coordinate vendors and approvals from one portal."
    },
    {
      icon: BarChart3,
      title: "Finance Teams",
      desc: "Monitor spend, approvals, and cost drivers."
    },
  ];

  const rolesContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const roleVariant = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const sectionFade = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const cardStagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const cardItem = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const floatIn = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center text-white"
              style={{ backgroundColor: "var(--mp-brand)" }}
            >
              <Wrench size={18} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-slate-900">FacilityPro</span>
              <span className="text-xs text-slate-500">Management System</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>Sign in</Button>
            <Button className="rounded-full px-5" style={{ backgroundColor: "var(--mp-brand)", color: "#fff" }} onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-md hover:bg-slate-100"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          id="mobile-nav"
          className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden border-t border-slate-100 bg-white`}
        >
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
            >
              Sign in
            </Button>
            <Button
              className="rounded-full px-5"
              style={{ backgroundColor: "var(--mp-brand)", color: "#fff" }}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/register");
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ================= HERO ================= */}
        <motion.section
          className="relative overflow-hidden"
          variants={!reduceMotion ? sectionFade : undefined}
          initial="hidden"
          animate="visible"
        >
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-16 grid lg:grid-cols-2 gap-14 items-center">

          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium" style={{ backgroundColor: "#eef6ff", color: "var(--mp-brand)" }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--mp-brand)" }} />
              Smart Maintenance Management Platform
            </span>

            <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Manage Facilities Smarter.
              <br />
              <span style={{ color: "var(--mp-brand)" }}>Reduce Downtime. Control Costs.</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              All-in-one platform to manage facilities, maintenance, vendors, and costs — in real time.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full px-6" style={{ backgroundColor: "var(--mp-brand)", color: "#fff" }} onClick={() => navigate("/register")}>
                Start 14-day Free Trial
              </Button>

              <Button size="lg" variant="outline" className="rounded-full px-6" style={{ borderColor: "var(--mp-brand)", color: "var(--mp-brand)" }} onClick={() => navigate("/demo")}>
                View Demo
              </Button>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              14-day free trial · No credit card required · Secure · Role-based access
            </p>
          </div>

          {/* Visual */}
          <div className="relative">
            <motion.div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ perspective: 900 }}
              className="relative"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >

              {/* Calendar (hidden on small screens) */}
              <motion.div
                style={{ x: calendarX, y: calendarY }}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 12px 30px rgba(2,6,23,0.12)' } : undefined} // ✅ ADDED
                className="hidden lg:block absolute lg:-right-12 lg:-top-12 w-80 h-60 rounded-2xl shadow-2xl overflow-hidden bg-slate-50"
              >
                <picture>
                  <source srcSet={CalendarWebpSrcSet} type="image/webp" />
                  <img
                    src={CalendarPngFallback}
                    alt="Maintenance calendar preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    width="320"
                    height="240"
                  />
                </picture>
              </motion.div>

              {/* Dashboard (responsive) */}
              <motion.div
                style={{ x: dashboardX, y: dashboardY }}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 18px 40px rgba(2,6,23,0.14)' } : undefined}
                className="relative w-full max-w-[540px] aspect-[16/10] rounded-2xl border border-slate-200 bg-white p-4 shadow-md mx-auto"
              >
                <img
                  src="/media/optimized/main-image-1280.webp"
                  srcSet={MainImageSrcSet}
                  sizes="(max-width: 1024px) 90vw, 540px"
                  alt="Product demo"
                  className="w-full h-full object-cover rounded-md"
                  fetchpriority="high"
                  loading="eager"
                  decoding="sync"
                  width="1600"
                  height="1000"
                />
              </motion.div>
              {/* Work order (hidden on small screens) */}
              <motion.div
                style={{ x: workX, y: workY }}
                className="hidden md:block absolute md:-left-12 md:-bottom-10 w-64 h-40 rounded-2xl shadow-lg border border-slate-100 bg-white"
              >
                <div className="p-3 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: "var(--mp-brand)" }}>
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-semibold text-slate-700">WO-3481</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${workOrderStatusClass}`}>{workOrderStatusLabel}</span>
                  </div>

                  <div className="mt-2">
                    <div className="text-sm font-semibold text-slate-900">Air handler vibration</div>
                    <div className="text-xs text-slate-500">HQ � Floor 3 � AHU-12</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Assignee: K. Ade</span>
                    <span>Due: Tomorrow</span>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================= FEATURE HIGHLIGHTS ================= */}
      <motion.section
        className="py-24"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Everything your facility team needs</h2>
            <p className="mt-4 text-slate-600">
              One platform to plan, execute, and report on maintenance operations.
            </p>
          </div>
          <motion.div
            className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {featureHighlights.map((feature) => (
              <motion.div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 16px 34px rgba(2,6,23,0.12)' } : undefined}
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white mb-4" style={{ backgroundColor: "var(--mp-brand)" }}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= ROLE HIGHLIGHTS ================= */}
      <motion.section
        className="py-24 bg-slate-50"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Built for every role</h2>
            <p className="mt-4 text-slate-600">
              Clear workflows for managers, technicians, vendors, and finance teams.
            </p>
          </div>
          <motion.div
            className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {roleHighlights.map((role) => (
              <motion.div
                key={role.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 16px 34px rgba(2,6,23,0.12)' } : undefined}
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white mb-4" style={{ backgroundColor: "var(--mp-brand)" }}>
                  <role.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{role.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{role.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= STATS ================= */}
      <motion.section
        className="py-24"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
                variants={!reduceMotion ? floatIn : undefined}
              >
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="mt-2 text-sm text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= HOW IT WORKS ================= */}
      <motion.section
        className="py-24 bg-slate-50"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-4 text-slate-600">
              Launch in days, not months.
            </p>
          </div>
          <motion.div
            className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {howItWorks.map((step) => (
              <motion.div
                key={step.step}
                className="rounded-2xl border border-slate-200 bg-white p-6"
                variants={!reduceMotion ? cardItem : undefined}
              >
                <div className="text-sm font-semibold text-slate-500">{step.step}</div>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= TESTIMONIALS ================= */}
      <motion.section
        className="py-24 bg-slate-50"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Loved by operations teams</h2>
            <p className="mt-4 text-slate-600">
              Real outcomes from teams running FacilityPro.
            </p>
          </div>
          <motion.div
            className="mt-12 grid md:grid-cols-3 gap-6"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 16px 34px rgba(2,6,23,0.12)' } : undefined}
              >
                <p className="text-sm text-slate-600">"{t.quote}"</p>
                <div className="mt-4 text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-slate-500">{t.role}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= INTEGRATIONS ================= */}
      <motion.section
        className="py-24"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Integrations that fit your stack</h2>
            <p className="mt-4 text-slate-600">
              Connect FacilityPro with the tools your team already uses.
            </p>
          </div>
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-3"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {integrations.map((item) => (
              <motion.span
                key={item}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                variants={!reduceMotion ? floatIn : undefined}
                whileHover={!reduceMotion ? { y: -3, boxShadow: '0 10px 20px rgba(2,6,23,0.08)' } : undefined}
              >
                {item}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= FAQ ================= */}
      <motion.section
        className="py-24 bg-slate-50"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
            <p className="mt-4 text-slate-600">
              Quick answers to the most common questions.
            </p>
          </div>
          <motion.div
            className="mt-10 grid gap-4"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {faqs.map((item) => (
              <motion.div
                key={item.q}
                className="rounded-2xl border border-slate-200 bg-white p-6"
                variants={!reduceMotion ? cardItem : undefined}
              >
                <div className="font-semibold">{item.q}</div>
                <div className="mt-2 text-sm text-slate-600">{item.a}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= SPOTLIGHT IMAGE ================= */}
      <motion.section
        className="py-16"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <img
              src="/media/optimized/center-image-1280.webp"
              srcSet={CenterImageSrcSet}
              sizes="(max-width: 1024px) 90vw, 1200px"
              alt="Facility operations overview"
              className="w-full h-[260px] sm:h-[320px] md:h-[460px] object-contain sm:object-cover rounded-2xl bg-slate-50"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </motion.section>

      {/* ================= PRICING PREVIEW ================= */}
      <motion.section
        className="py-24 bg-slate-50"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-slate-600">
              Seat-based pricing with a 14-day free trial. Save 20% with annual billing.
            </p>
          </div>

          <motion.div
            className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {PRICING_PLANS.map((plan, index) => (
              <motion.div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (plan.id === "enterprise") {
                    navigate("/contact-sales");
                  } else {
                    navigate(`/register?plan=${plan.id}`);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (plan.id === "enterprise") {
                      navigate("/contact-sales");
                    } else {
                      navigate(`/register?plan=${plan.id}`);
                    }
                  }
                }}
                className={`rounded-xl border bg-white p-8 cursor-pointer transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300 ${plan.popular ? 'border-blue-500 shadow-lg' : 'border-slate-200'}`}
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 18px 40px rgba(2,6,23,0.12)' } : undefined}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-slate-600 mt-1">{plan.description}</p>
                  {plan.id === "enterprise" ? (
                    <div className="mt-4 text-4xl font-bold">Custom</div>
                  ) : (
                    <div className="mt-4 flex items-baseline justify-center gap-1">
                      <span className="text-base font-semibold text-slate-600">₦</span>
                      <span className="text-4xl font-bold tabular-nums">
                        {formatNgnParts(plan.monthly).amount}
                      </span>
                      <span className="text-slate-600">/month</span>
                    </div>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4" style={{ color: "var(--mp-brand)" }} />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.name === "Enterprise" ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      style={{ borderColor: "var(--mp-brand)", color: "var(--mp-brand)" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate("/contact-sales");
                      }}
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-full"
                      style={{ backgroundColor: "var(--mp-brand)", color: "#fff" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/register?plan=${plan.id}`);
                      }}
                    >
                      Get Started
                    </Button>
                  )}
                </div>
                {plan.name !== "Enterprise" && (
                  <p className="mt-3 text-xs text-slate-500 text-center">20% off annual billing</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= CTA ================= */}
      <section
        className="py-24 text-white"
        style={{ backgroundColor: "var(--mp-brand)" }}
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Ready to modernize your facility operations?
          </h2>
          <p className="mt-4 text-white/90">
            Start managing maintenance smarter today with FacilityPro.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-6"
              style={{ backgroundColor: "#fff", color: "var(--mp-brand)" }}
              onClick={() => navigate("/register")}
            >
              Create Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white text-white px-6"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: "var(--mp-brand)" }}
                >
                  <Wrench size={18} />
                </div>
                <span className="font-semibold text-slate-900">FacilityPro</span>
              </div>
              <p className="text-sm text-slate-600">
                Smart Maintenance Management Platform for modern facilities.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Features</a></li>
                <li>
                  <button
                    type="button"
                    className="hover:text-slate-900"
                    onClick={() => navigate("/pricing")}
                  >
                    Pricing
                  </button>
                </li>
                <li><a href="#" className="hover:text-slate-900">Security</a></li>
                <li><a href="#" className="hover:text-slate-900">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">About</a></li>
                <li><a href="#" className="hover:text-slate-900">Blog</a></li>
                <li><a href="#" className="hover:text-slate-900">Careers</a></li>
                <li><a href="#" className="hover:text-slate-900">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><button type="button" className="hover:text-slate-900" onClick={() => navigate("/help-center")}>Help Center</button></li>
                <li><a href="#" className="hover:text-slate-900">Documentation</a></li>
                <li><a href="#" className="hover:text-slate-900">Community</a></li>
                <li><a href="#" className="hover:text-slate-900">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} FacilityPro. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-900">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900">Terms of Service</a>
              <a href="#" className="hover:text-slate-900">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;














