// One track = one הלוואה/מסלול, matched by the advisor between the אישור
// עקרוני (approved terms) and יתרות לסילוק (current payoff) documents.
export interface MortgageTrack {
  loanNumber: string;
  trackName: string; // e.g. "משתנה לא צמודה", "קבועה צמודה מדד", "זכאות אישית"
  linkage: "linked" | "unlinked"; // צמוד מדד / לא צמוד
  rateType: "fixed" | "variable"; // קבועה / משתנה
  approvedAmount: number | null;
  approvedRateAdjusted: number | null; // % ריבית מתואמת, מהאישור העקרוני
  approvedPeriodMonths: number | null;
  actualAmount: number | null;
  actualRateAdjusted: number | null; // % ריבית מתואמת עדכנית, מיתרות הסילוק
  actualPeriodMonths: number | null;
  currentPrincipalBalance: number | null; // יתרת קרן
  drawDate: string; // DD/MM/YYYY, תאריך מתן ההלוואה
  nextRateChangeDate: string | null; // תאריך שינוי קרוב (למסלולים משתנים)
  rateChangeFrequencyMonths: number | null; // תדירות שינוי ריבית
  currentMonthlyPayment: number | null; // חיוב אחרון בהלוואה
}

export interface MortgageData {
  clientName: string;
  idNumber: string | null;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
  approvedDate: string | null; // תאריך הפקת אישור
  payoffDate: string | null; // תאריך הדפסה
  totalApprovedAmount: number | null;
  totalActualAmount: number | null;
  totalCurrentBalance: number | null;
  totalApprovedMonthlyPayment: number | null;
  totalCurrentMonthlyPayment: number | null;
  tracks: MortgageTrack[];
}

// One column in a "מצב נוכחי / משכנתה חדשה היום / מיחזור אפשרי" comparison
// table, e.g. from a SMARTNPV-style תמהילים report. Aggregate-level only —
// deliberately doesn't break down which tracks would change, so the report
// doesn't hand the client a DIY refinancing recipe.
export interface ComparisonScenario {
  label: string; // e.g. "המשכנתה הנוכחית", "משכנתה חדשה, היום", "מיחזור אפשרי"
  firstPayment: number | null; // החזר ראשון
  totalInterestAndLinkage: number | null; // תשלומי ריבית והצמדה, סה"כ
  totalCost: number | null; // עלות כוללת לתקופה
  irr: number | null; // שיעור תשואה פנימי (שת"פ), %
  savingsVsCurrent: number | null; // הפרש/חיסכון לעומת המצב הנוכחי, בש"ח
}

export interface MortgageComparison {
  asOfDate: string | null; // תאריך הדוח שהושוו לפיו
  scenarios: ComparisonScenario[];
  note: string | null; // הערה רכה, למשל על חלופת מיחזור עם חשיפה מופחתת למדד
}

export const EMPTY_SCENARIO: ComparisonScenario = {
  label: "",
  firstPayment: null,
  totalInterestAndLinkage: null,
  totalCost: null,
  irr: null,
  savingsVsCurrent: null,
};

export const EMPTY_TRACK: MortgageTrack = {
  loanNumber: "",
  trackName: "",
  linkage: "unlinked",
  rateType: "fixed",
  approvedAmount: null,
  approvedRateAdjusted: null,
  approvedPeriodMonths: null,
  actualAmount: null,
  actualRateAdjusted: null,
  actualPeriodMonths: null,
  currentPrincipalBalance: null,
  drawDate: "",
  nextRateChangeDate: null,
  rateChangeFrequencyMonths: null,
  currentMonthlyPayment: null,
};
