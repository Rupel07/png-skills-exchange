export const colors = {
  primary: "#1F6FEB",
  primarySoft: "#E3EEFF",
  onPrimary: "#FFFFFF",
  onPrimaryMuted: "#DCE9FF",
  onPrimarySoft: "#EAF2FF",
  background: "#F5F6F8",
  surface: "#FFFFFF",
  text: "#222222",
  textMuted: "#5B6470",
  tipText: "#2A4A7F",
  border: "#D5D9DF",
  divider: "#E3E6EB",
  inactive: "#8A94A6",
  danger: "#D32F2F",
  dangerText: "#B00020",
  dangerBg: "#FBE0E0",
  success: "#246b45",
  successText: "#1B7F3B",
  successBg: "#DDF3E4",
  warningBg: "#FFF4D6",
  warningText: "#9A6B00",
  neutralBg: "#E6E8EB",
  neutralText: "#555555",
};

export const statusColors = {
  pending: { bg: colors.warningBg, fg: colors.warningText },
  accepted: { bg: colors.successBg, fg: colors.successText },
  declined: { bg: colors.dangerBg, fg: colors.dangerText },
  cancelled: { bg: colors.neutralBg, fg: colors.neutralText },
  completed: { bg: colors.primarySoft, fg: colors.primary },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 20 };
