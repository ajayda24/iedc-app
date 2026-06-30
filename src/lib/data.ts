export type Feature = {
  title: string;
  desc: string;
  icon: string;
  tint: string;
};

export const FEATURES: Feature[] = [
  {
    title: "Event Participation",
    desc: "Discover hackathons, bootcamps & workshops and register in a tap.",
    icon: "calendar",
    tint: "var(--blue)",
  },
  {
    title: "Leaderboards",
    desc: "Climb live rankings as you earn innovation points across campuses.",
    icon: "trophy",
    tint: "var(--peach)",
  },
  {
    title: "Achievements",
    desc: "Unlock badges and milestones that showcase your builder journey.",
    icon: "medal",
    tint: "var(--lavender)",
  },
  {
    title: "Certificates",
    desc: "Earn verifiable, shareable certificates the moment you complete.",
    icon: "certificate",
    tint: "var(--mint)",
  },
  {
    title: "Startup Building",
    desc: "Turn ideas into ventures with tools, templates and funding paths.",
    icon: "rocket",
    tint: "var(--indigo)",
  },
  {
    title: "Team Collaboration",
    desc: "Form teams, assign roles and ship together in shared workspaces.",
    icon: "team",
    tint: "var(--sky)",
  },
  {
    title: "Mentorship",
    desc: "Get matched with founders and experts for 1:1 guidance.",
    icon: "compass",
    tint: "var(--blue)",
  },
  {
    title: "Analytics",
    desc: "Track growth with insights on participation, points and impact.",
    icon: "chart",
    tint: "var(--mint)",
  },
];

export type Step = {
  n: string;
  title: string;
  desc: string;
  icon: string;
  tint: string;
};

export const JOURNEY: Step[] = [
  {
    n: "01",
    title: "Register",
    desc: "Create your innovator profile and join your campus IEDC in minutes.",
    icon: "user",
    tint: "var(--blue)",
  },
  {
    n: "02",
    title: "Participate",
    desc: "Join events, challenges and sprints that match your interests.",
    icon: "calendar",
    tint: "var(--sky)",
  },
  {
    n: "03",
    title: "Earn Points",
    desc: "Every contribution rewards points that grow your reputation.",
    icon: "spark",
    tint: "var(--peach)",
  },
  {
    n: "04",
    title: "Unlock Achievements",
    desc: "Hit milestones to reveal badges, perks and new opportunities.",
    icon: "medal",
    tint: "var(--lavender)",
  },
  {
    n: "05",
    title: "Build Startups",
    desc: "Graduate your idea into a funded venture with mentor support.",
    icon: "rocket",
    tint: "var(--indigo)",
  },
];

export const STATS = [
  { value: "10K+", label: "Students", icon: "team", tint: "var(--blue)" },
  { value: "500+", label: "Events", icon: "trophy", tint: "var(--peach)" },
  { value: "50+", label: "Startups", icon: "star", tint: "var(--mint)" },
  { value: "120+", label: "Campuses", icon: "compass", tint: "var(--lavender)" },
];

export type TeamMember = {
  name: string;
  position: string;
  profile_image: string;
  tint: string;
  /** the tutor / nodal coordinator gets a highlighted card */
  lead?: boolean;
};

// Drop the matching images into /public/team/ (e.g. /public/team/arjun.jpg).
// If an image is missing the card gracefully shows the member's initials.
export const TEAM: TeamMember[] = [
  {
    name: "Chithra Valassery",
    position: "IEDC Tutor Coordinator",
    profile_image: "/team/chithra.jpg",
    tint: "var(--indigo)",
    lead: true,
  },
  {
    name: "Ajay Daniel Trevor",
    position: "Student Lead",
    profile_image: "/team/student_lead.jpg",
    tint: "var(--blue)",
  },
  {
    name: "Devika C",
    position: "Student Lead",
    profile_image: "/team/student_lead_female.jpg",
    tint: "var(--sky)",
  },
  {
    name: "Navami E",
    position: "Operative Lead",
    profile_image: "/team/operative_lead.jpg",
    tint: "var(--mint)",
  },
  {
    name: "Amjad Khan M P",
    position: "Startup Development Lead",
    profile_image: "/team/startup_development_lead.jpg",
    tint: "var(--peach)",
  },
  {
    name: "Nijin Raj T",
    position: "Finance Lead",
    profile_image: "/team/finance_lead.jpg",
    tint: "var(--lavender)",
  },
  {
    name: "Dilkush Ameen",
    position: "Technical Lead",
    profile_image: "/team/technical_lead.jpg",
    tint: "var(--blue)",
  },
  {
    name: "Trishaa B",
    position: "Women Entrepreneurship Lead",
    profile_image: "/team/women_entrepreneurship_lead.jpg",
    tint: "var(--lavender)",
  },
  {
    name: "Gopika P",
    position: "Creative Lead",
    profile_image: "/team/creative_lead.jpg",
    tint: "var(--mint)",
  },
  {
    name: "Keerthi Mohan",
    position: "Creative Co-Lead",
    profile_image: "/team/creative_co_lead.jpg",
    tint: "var(--peach)",
  },
  {
    name: "Ajin K Reji",
    position: "Community Lead",
    profile_image: "/team/community_lead.jpg",
    tint: "var(--sky)",
  },
  {
    name: "Eswal Narayanan",
    position: "Marketing Lead",
    profile_image: "/team/marketing_lead.jpg",
    tint: "var(--blue)",
  },
  {
    name: "Muhammed Shanif V",
    position: "IPR & Research Lead",
    profile_image: "/team/ipr_&_research_lead.jpg",
    tint: "var(--peach)",
  },
  {
    name: "Muhammed Zahir M",
    position: "IPR & Research Co-Lead",
    profile_image: "/team/ipr_&_research_co_lead.jpg",
    tint: "var(--mint)",
  },
];

export const COMMUNITY = [
  {
    quote:
      "IEDC Hub turned our class project into a funded startup. The mentorship and momentum are unreal.",
    name: "Aparna Nair",
    role: "Founder, LeafLogic",
    tint: "var(--mint)",
  },
  {
    quote:
      "Climbing the leaderboard kept our whole team shipping every single week. It's addictive in the best way.",
    name: "Rahul Menon",
    role: "Lead, CET Innovators",
    tint: "var(--blue)",
  },
  {
    quote:
      "From my first hackathon to a national finalist — the entire journey lived inside one beautiful app.",
    name: "Sneha Thomas",
    role: "Student Builder",
    tint: "var(--peach)",
  },
];
