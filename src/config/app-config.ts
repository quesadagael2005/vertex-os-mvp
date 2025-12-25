import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Vertex OS",
  version: packageJson.version,
  copyright: `© ${currentYear}, Red Shirt Club.`,
  meta: {
    title: "Vertex OS - Admin Dashboard",
    description:
      "Backend system for Red Shirt Club cleaning service. Manage jobs, members, cleaners, payouts, and more.",
  },
};

