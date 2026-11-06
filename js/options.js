// Every coded answer in the study, in one place.
// Forms, validation, and the admin tables all read from these lists.

var PRIVACY_POLICY_VERSION = "2026-10-26";

var AGE_RANGES = [
  { value: "18_24", label: "18–24" },
  { value: "25_34", label: "25–34" },
  { value: "35_44", label: "35–44" },
  { value: "45_54", label: "45–54" },
  { value: "55_64", label: "55–64" },
  { value: "65_plus", label: "65 and over" },
  { value: "prefer_not", label: "Prefer not to say" },
];

var GENDERS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "another", label: "Another identity" },
  { value: "prefer_not", label: "Prefer not to say" },
];

var RELATIONSHIP_STATUSES = [
  { value: "single", label: "Single" },
  { value: "in_relationship", label: "In a relationship" },
  { value: "live_in", label: "Living with a partner" },
  { value: "married", label: "Married" },
  { value: "separated", label: "Separated or annulled" },
  { value: "widowed", label: "Widowed" },
  { value: "prefer_not", label: "Prefer not to say" },
];

var OCCUPATIONS = [
  { value: "student", label: "Student" },
  { value: "working_student", label: "Working student" },
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed or freelance" },
  { value: "ofw", label: "Overseas Filipino worker" },
  { value: "unemployed", label: "Looking for work" },
  { value: "homemaker", label: "Homemaker or caregiver" },
  { value: "retired", label: "Retired" },
  { value: "prefer_not", label: "Prefer not to say" },
];

var ENTRY_KINDS = [
  { value: "story", label: "A story", hint: "Something that happened to you" },
  { value: "dilemma", label: "A dilemma", hint: "A decision you are facing" },
];

// Each theme keeps its color on every screen. Keep this order.
var CATEGORIES = [
  { value: "family", label: "Family", color: "#2f6fc4" },
  { value: "love", label: "Love and relationships", color: "#b3364a" },
  { value: "friendship", label: "Friendship", color: "#0b93a8" },
  { value: "school", label: "School and studies", color: "#d9622b" },
  { value: "work", label: "Work and career", color: "#4b3fa0" },
  { value: "money", label: "Money", color: "#c48d0e" },
  { value: "health", label: "Health and wellbeing", color: "#9b4fa3" },
  { value: "identity", label: "Identity and self", color: "#1f8a5c" },
  { value: "other", label: "Something else", color: "#7d8580" },
];

var FEELINGS = [
  { value: "anxious", label: "Anxious" },
  { value: "sad", label: "Sad" },
  { value: "angry", label: "Angry" },
  { value: "confused", label: "Confused" },
  { value: "lonely", label: "Lonely" },
  { value: "guilty", label: "Guilty" },
  { value: "ashamed", label: "Ashamed" },
  { value: "afraid", label: "Afraid" },
  { value: "hopeful", label: "Hopeful" },
  { value: "relieved", label: "Relieved" },
];

var TOLD_ANYONE = [
  { value: "no_one", label: "No one yet" },
  { value: "friend_family", label: "A friend or family member" },
  { value: "professional", label: "A counselor or professional" },
  { value: "online", label: "An online community" },
  { value: "prefer_not", label: "Prefer not to say" },
];

var INTENSITY_LABELS = ["Light", "Noticeable", "Heavy", "Very heavy", "Overwhelming"];

var ENTRY_WORD_LIMIT = 1500;

// Philippine crisis lines. Check these numbers before the study launches.
var CRISIS_LINES = [
  { name: "NCMH Crisis Hotline", numbers: ["1553 (landline, toll-free)", "0917 899 8727", "0966 351 4518"], note: "24/7" },
  { name: "Hopeline Philippines", numbers: ["(02) 8804 4673", "0917 558 4673", "2919 (Globe/TM, toll-free)"], note: "24/7" },
  { name: "In Touch Crisis Line", numbers: ["(02) 8893 7603", "0917 800 1123"], note: "24/7" },
];

function labelOf(list, value) {
  var found = list.find(function (o) { return o.value === value; });
  return found ? found.label : value;
}

function hasValue(list, value) {
  return list.some(function (o) { return o.value === value; });
}
