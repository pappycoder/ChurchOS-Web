export interface DenominationGroup {
  label: string;
  denominations: string[];
}

export const DENOMINATION_GROUPS: DenominationGroup[] = [
  {
    label: "Catholic",
    denominations: [
      "Roman Catholic",
      "Eastern Catholic",
      "Maronite Catholic",
      "Melkite Greek Catholic",
      "Ukrainian Greek Catholic",
      "Syro-Malabar Catholic",
      "Ethiopian Catholic",
    ],
  },
  {
    label: "Protestant",
    denominations: [
      "Anglican",
      "Baptist",
      "Calvary Baptist",
      "First Baptist",
      "Missionary Baptist",
      "Southern Baptist",
      "Christian Missionary Alliance",
      "Church of Christ",
      "Church of God",
      "Church of God in Christ",
      "Congregational",
      "Episcopalian",
      "Evangelical",
      "Foursquare Gospel",
      "Lutheran",
      "Mennonite",
      "Methodist",
      "African Methodist Episcopal",
      "Nazarene",
      "Pentecostal",
      "Assemblies of God",
      "Charismatic",
      "Deeper Life Bible Church",
      "Presbyterian",
      "Reformed",
      "Salvation Army",
      "Seventh-day Adventist",
      "Wesleyan",
    ],
  },
  {
    label: "Orthodox",
    denominations: [
      "Eastern Orthodox",
      "Greek Orthodox",
      "Russian Orthodox",
      "Serbian Orthodox",
      "Romanian Orthodox",
      "Ethiopian Orthodox",
      "Eritrean Orthodox",
      "Coptic Orthodox",
      "Syriac Orthodox",
      "Armenian Apostolic",
    ],
  },
  {
    label: "African Initiated Churches",
    denominations: [
      "Celestial Church of Christ",
      "Christ Apostolic Church",
      "Christ Apostolic Church Worldwide",
      "Cherubim and Seraphim",
      "Church of the Lord (Aladura)",
      "Qua Iboe Church",
      "Redeemed Christian Church of God",
      "Winner's Chapel (Living Faith Church)",
      "Mountain of Fire and Miracles Ministries",
      "Deep Life Bible Church",
      "New Covenant Bible Church",
      "Faith Tabernacle",
      "Divine HAND Ministry",
    ],
  },
  {
    label: "Other",
    denominations: [
      "Non-Denominational",
      "Independent",
      "Community Church",
      "Bible Church",
      "Full Gospel",
      "Messianic Jewish",
      "Jehovah's Witnesses",
      "Latter Day Saints (Mormon)",
      "Unitarian",
    ],
  },
];

export const ALL_DENOMINATIONS: string[] = DENOMINATION_GROUPS.flatMap(
  (g) => g.denominations
).sort((a, b) => a.localeCompare(b));
