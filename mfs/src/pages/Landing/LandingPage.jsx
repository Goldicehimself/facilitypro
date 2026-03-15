import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Wrench,
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

// Optimized variants created by tools/generate-screenshots.js
const DashboardWebpSrcSet = [480,768,1024,1440].map(w => `${new URL(`../../assets/screenshots/optimized/elaadmin-dashboard-template-${w}.webp`, import.meta.url).href} ${w}w`).join(', ');
const DashboardPngFallback = new URL('../../assets/screenshots/optimized/elaadmin-dashboard-template-1024.png', import.meta.url).href;
const DashboardLarge = new URL('../../assets/screenshots/optimized/elaadmin-dashboard-template-1440.png', import.meta.url).href;

const WorkWebpSrcSet = [480,768,1024,1440].map(w => `${new URL(`../../assets/screenshots/optimized/work-order-${w}.webp`, import.meta.url).href} ${w}w`).join(', ');
const WorkPngFallback = new URL('../../assets/screenshots/optimized/work-order-1024.png', import.meta.url).href;
const WorkLarge = new URL('../../assets/screenshots/optimized/work-order-1440.png', import.meta.url).href;

const CalendarWebpSrcSet = [480,768,1024,1440].map(w => `${new URL(`../../assets/screenshots/optimized/2-2-calendar-png-image-${w}.webp`, import.meta.url).href} ${w}w`).join(', ');
const CalendarPngFallback = new URL('../../assets/screenshots/optimized/2-2-calendar-png-image-768.png', import.meta.url).href;
const CalendarLarge = new URL('../../assets/screenshots/optimized/2-2-calendar-png-image-1440.png', import.meta.url).href;

const MainImageSrcSet = [640, 960, 1280, 1600]
  .map((w) => `/assets/optimized/main-image-${w}.webp ${w}w`)
  .join(', ');
const CenterImageSrcSet = [640, 960, 1280, 1600]
  .map((w) => `/assets/optimized/center-image-${w}.webp ${w}w`)
  .join(', ');

const LandingPage = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const rolesContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const roleVariant = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const trustContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const trustItem = {
    hidden: { opacity: 0, y: 12 },
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
        <div className="mx-auto max-w-7xl px-6 py-28 grid lg:grid-cols-2 gap-14 items-center">

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
                Start Free
              </Button>

              <Button size="lg" variant="outline" className="rounded-full px-6" style={{ borderColor: "var(--mp-brand)", color: "var(--mp-brand)" }} onClick={() => navigate("/login")}>
                View Demo
              </Button>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              No credit card required · Secure · Role-based access
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
                  src="/assets/optimized/main-image-1280.webp"
                  srcSet={MainImageSrcSet}
                  sizes="(max-width: 1024px) 90vw, 540px"
                  alt="Product demo"
                  className="w-full h-full object-cover rounded-md"
                  fetchpriority="high"
                  decoding="async"
                  width="1600"
                  height="1000"
                />
              </motion.div>

              {/* Work order (hidden on small screens) */}
              <motion.div
                style={{ x: workX, y: workY }}
                className="hidden md:block absolute md:-left-10 md:-bottom-8 w-56 h-36 rounded-2xl shadow-md overflow-hidden border border-slate-100 bg-white"
              >
                {!reduceMotion && (
                  <motion.div
                    className="absolute right-2 top-2 p-2 rounded-full bg-white/90"
                    animate={{ rotate: 360 }}
                    whileHover={{ rotate: 0 }} // ✅ ADDED
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  >
                    <Settings className="h-4 w-4" />
                  </motion.div>
                )}

                <picture>
                  <source srcSet={WorkWebpSrcSet} type="image/webp" />
                  <img
                    src={WorkPngFallback}
                    alt="Work order preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    width="224"
                    height="144"
                  />
                </picture>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================= TRUST STRIP ================= */}
      <motion.section
        className="border-y border-slate-100 bg-slate-50"
        variants={!reduceMotion ? trustContainer : undefined}
        initial="hidden"
        whileInView="visible"           // ✅ ADDED
        viewport={{ once: true }}       // ✅ ADDED
      >
        <div className="mx-auto max-w-7xl px-6 py-10 grid sm:grid-cols-3 gap-8 text-center">
          {[
            "Enterprise-grade security",
            "Designed for real operations",
            "Scales with your organization",
          ].map(item => (
            <motion.div key={item} variants={trustItem} className="flex items-center justify-center gap-2 text-slate-600">
              <ShieldCheck className="h-5 w-5" style={{ color: "var(--mp-brand)" }} />
              <span className="font-medium">{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>
      {/* ================= FEATURES ================= */}
      <motion.section
        className="py-24"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">
              Everything you need to run maintenance efficiently
            </h2>
            <p className="mt-4 text-slate-600">
              Built specifically for facility-centric organizations.
            </p>
          </div>

          <motion.div
            className="mt-16 grid md:grid-cols-3 gap-8"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              "Work Order Management",
              "Preventive Maintenance",
              "Asset Tracking",
              "Vendor Management",
              "Role-Based Access",
              "Reporting & Analytics",
            ].map((feature) => (
              <motion.div
                key={feature}
                className="flex gap-3 rounded-xl border border-slate-200 p-6"
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -4, boxShadow: '0 14px 30px rgba(2,6,23,0.10)' } : undefined}
              >
                <CheckCircle
                  className="h-5 w-5 mt-1"
                  style={{ color: "var(--mp-brand)" }}
                />
                <p className="text-slate-700">{feature}</p>
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
            <h2 className="text-3xl font-bold">
              How It Works
            </h2>
            <p className="mt-4 text-slate-600">
              Get started in minutes with our simple setup process.
            </p>
          </div>

          <motion.div
            className="mt-16 grid md:grid-cols-4 gap-8"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              {
                step: "1",
                title: "Set up facilities & assets",
                description: "Import your facility data and asset inventory"
              },
              {
                step: "2",
                title: "Assign roles & teams",
                description: "Configure permissions and team structures"
              },
              {
                step: "3",
                title: "Track maintenance & vendors",
                description: "Monitor work orders and vendor performance"
              },
              {
                step: "4",
                title: "Analyze performance & costs",
                description: "Generate reports and optimize operations"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -4 } : undefined}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--mp-brand)", color: "#fff" }}>
                  <span className="font-bold">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= ROLE-BASED BENEFITS ================= */}
      <motion.section
        className="py-24"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">
              Solutions for Every Role
            </h2>
            <p className="mt-4 text-slate-600">
              Tailored tools that address specific pain points for each team member.
            </p>
          </div>

          <motion.div
            className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              {
                role: "Facility Managers",
                painPoints: ["Reactive maintenance", "Cost overruns", "Poor visibility"],
                solutions: ["Predictive scheduling", "Budget control", "Real-time dashboards"]
              },
              {
                role: "Maintenance Technicians",
                painPoints: ["Manual paperwork", "Parts delays", "Unclear priorities"],
                solutions: ["Mobile app access", "Automated inventory", "Smart work orders"]
              },
              {
                role: "Vendors & Contractors",
                painPoints: ["Delayed payments", "Poor communication", "Manual invoicing"],
                solutions: ["Automated billing", "Direct messaging", "Performance tracking"]
              },
              {
                role: "Finance Teams",
                painPoints: ["Hidden costs", "Manual reporting", "Budget surprises"],
                solutions: ["Cost analytics", "Automated reports", "Predictive budgeting"]
              },
              {
                role: "Operations Staff",
                painPoints: ["Communication gaps", "Status confusion", "Manual updates"],
                solutions: ["Centralized platform", "Real-time updates", "Automated workflows"]
              },
              {
                role: "Compliance Officers",
                painPoints: ["Audit preparation", "Documentation gaps", "Regulatory tracking"],
                solutions: ["Audit trails", "Compliance reports", "Automated logging"]
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6"
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 18px 40px rgba(2,6,23,0.10)' } : undefined}
              >
                <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--mp-brand)" }}>
                  {item.role}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Pain Points:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {item.painPoints.map((point, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-red-400"></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">FacilityPro Solutions:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {item.solutions.map((solution, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" style={{ color: "var(--mp-brand)" }} />
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ================= PRODUCT PREVIEW ================= */}
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
              See FacilityPro in Action
            </h2>
            <p className="mt-4 text-slate-600">
              Powerful dashboards and intuitive interfaces designed for real-world operations.
            </p>
          </div>

          <div className="mt-16">
            <motion.div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ perspective: 900 }}
              className="relative max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                style={{ x: dashboardX, y: dashboardY }}
                whileHover={!reduceMotion ? { y: -6, boxShadow: '0 18px 40px rgba(2,6,23,0.14)' } : undefined}
                className="relative w-full aspect-[16/10] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg mx-auto"
              >
                <img
                  src="/assets/optimized/center-image-1280.webp"
                  srcSet={CenterImageSrcSet}
                  sizes="(max-width: 1024px) 90vw, 896px"
                  alt="Facility dashboard preview"
                  className="w-full h-full object-cover rounded-md"
                  loading="lazy"
                  decoding="async"
                  width="1600"
                  height="1000"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================= TESTIMONIALS ================= */}
      <motion.section
        className="py-24"
        variants={!reduceMotion ? sectionFade : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">
              Trusted by Facility Teams Worldwide
            </h2>
            <p className="mt-4 text-slate-600">
              See how organizations are transforming their maintenance operations.
            </p>
          </div>

          <motion.div
            className="mt-16 grid md:grid-cols-3 gap-8"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              {
                quote: "FacilityPro reduced our maintenance response time by 60% and saved us $200K in the first year.",
                name: "Sarah Johnson",
                role: "Facility Manager",
                company: "TechCorp Industries",
                avatar: "SJ"
              },
              {
                quote: "The vendor management system alone paid for itself within 3 months. Game-changing platform.",
                name: "Mike Chen",
                role: "Operations Director",
                company: "Metro Healthcare",
                avatar: "MC"
              },
              {
                quote: "Finally, a maintenance platform that understands real facility operations. Intuitive and powerful.",
                name: "Lisa Rodriguez",
                role: "Maintenance Supervisor",
                company: "Global Logistics",
                avatar: "LR"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6"
                variants={!reduceMotion ? cardItem : undefined}
                whileHover={!reduceMotion ? { y: -4, boxShadow: '0 14px 30px rgba(2,6,23,0.10)' } : undefined}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 italic mb-4">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">{testimonial.role}</p>
                      <p className="text-sm text-slate-500">{testimonial.company}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
              Seat-based pricing with a 14-day Pro trial. Save 20% with annual billing.
            </p>
          </div>

          <motion.div
            className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={!reduceMotion ? cardStagger : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              {
                name: "Starter",
                price: "$19",
                period: "/month",
                description: "For small teams getting started",
                features: [
                  "5 seats included",
                  "$4 per extra seat",
                  "Work orders, assets, vendors",
                  "Basic reporting",
                  "Email support"
                ],
                popular: false
              },
              {
                name: "Professional",
                price: "$39",
                period: "/month",
                description: "Best for growing teams",
                features: [
                  "10 seats included",
                  "$4 per extra seat",
                  "Advanced reporting",
                  "PM scheduling",
                  "Notifications automation",
                  "API access",
                  "Priority support"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                description: "For large-scale operations",
                features: [
                  "SSO & audit logs",
                  "Advanced security controls",
                  "Custom integrations",
                  "Dedicated onboarding",
                  "SLA support"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => navigate("/pricing")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate("/pricing");
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
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
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
                        navigate("/help-center");
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
                        navigate("/register");
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
