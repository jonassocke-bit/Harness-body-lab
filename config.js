export const CONTROLS = [
  { id:"gender", label:"Gender", min:0, max:1, step:.01, value:.50 },
  { id:"weight", label:"Weight", min:0, max:1, step:.01, value:.50 },
  { id:"muscle", label:"Muscle", min:0, max:1, step:.01, value:.50 },
  { id:"height", label:"Height", min:0, max:1, step:.01, value:.50 },
  { id:"proportions", label:"Proportions", min:0, max:1, step:.01, value:.50 },
  { id:"breastSize", label:"Breast size", min:0, max:1, step:.01, value:.50 },
  { id:"breastFirmness", label:"Breast firmness", min:0, max:1, step:.01, value:.50 },

  // Harness-relevante Detailregler. Die Adapter-Schicht erlaubt später,
  // mehrere MakeHuman-Targets pro sichtbarem Slider zu mischen.
  { id:"shoulders", label:"Shoulders", min:-1, max:1, step:.01, value:0 },
  { id:"chest", label:"Chest", min:-1, max:1, step:.01, value:0 },
  { id:"waist", label:"Waist", min:-1, max:1, step:.01, value:0 },
  { id:"hips", label:"Hips", min:-1, max:1, step:.01, value:0 },
  { id:"butt", label:"Butt", min:-1, max:1, step:.01, value:0 },
  { id:"thighs", label:"Thighs", min:-1, max:1, step:.01, value:0 },
  { id:"calves", label:"Calves", min:-1, max:1, step:.01, value:0 },
  { id:"arms", label:"Arms", min:-1, max:1, step:.01, value:0 },
];

export const PRESETS = {
  neutral: {},
  female: { gender:.15, breastSize:.62, waist:-.12, hips:.18 },
  male: { gender:.88, breastSize:.28, shoulders:.20, hips:-.08 },
  curvy: { gender:.20, weight:.68, breastSize:.74, waist:.08, hips:.48, butt:.44, thighs:.20 },
  muscular: { gender:.72, weight:.52, muscle:.90, shoulders:.46, chest:.34, arms:.30, thighs:.28 }
};

// Exact MakeHuman macro modifier names verified in MakeHuman source.
// Detail target paths intentionally live in manifest.json instead of being guessed here.
export const VERIFIED_MAKEHUMAN_MODIFIERS = {
  gender: "macrodetails/Gender",
  weight: "macrodetails-universal/Weight",
  muscle: "macrodetails-universal/Muscle",
  height: "macrodetails-height/Height",
  proportions: "macrodetails-proportions/BodyProportions",
  breastSize: "breast/BreastSize",
  breastFirmness: "breast/BreastFirmness"
};
