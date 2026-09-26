// Shared between the Process model (server) and the capacity form/map
// (client) - kept in its own plain file so client components never need
// to import anything from lib/models/*, which pull in mongoose.
export const TIME_FACTORS = ["Hour", "Shift", "Day", "Week", "Month"];

export const TIME_FACTOR_ABBR = {
  Hour: "hr",
  Shift: "shift",
  Day: "day",
  Week: "wk",
  Month: "mo",
};
