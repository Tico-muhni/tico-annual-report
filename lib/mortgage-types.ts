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
