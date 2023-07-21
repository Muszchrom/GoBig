const colors = [
  "rgb(255, 199, 199)",
  "rgb(255, 232, 192)",
  "rgb(255, 243, 143)",
  "rgb(185, 230, 181)",
  "rgb(183, 228, 255)",
  "rgb(230, 200, 246)",
  "rgb(255, 201, 228)"
];
// const exp = ;

const semesterBlueprint = {
  semesterStart: "2023-02-27",
  semesterEnd: "2023-06-23",
  weeks: [
    {
      start: "2023-02-27",
      offDays: [],
      isOdd: true,
      number: 1
    },
    {
      start: "2023-03-06",
      offDays: [],
      isOdd: false,
      number: 2
    },
    {
      start: "2023-03-13",
      offDays: [],
      isOdd: true,
      number: 3
    },
    {
      start: "2023-03-20",
      offDays: [],
      isOdd: false,
      number: 4
    },
    {
      start: "2023-03-27",
      offDays: [],
      isOdd: true,
      number: 5
    },
    {
      start: "2023-04-03",
      offDays: ["2023-04-05", "2023-04-06", "2023-04-07", "2023-04-08", "2023-04-09"],
      isOdd: false,
      number: 6
    },
    {
      start: "2023-04-10",
      offDays: ["2023-04-10", "2023-04-11"],
      isOdd: false,
      number: 7
    },
    {
      start: "2023-04-17",
      offDays: [],
      isOdd: true,
      number: 8
    },
    {
      start: "2023-04-24",
      offDays: [],
      isOdd: false,
      number: 9
    },
    {
      start: "2023-05-01",
      offDays: ["2023-05-01", "2023-05-02", "2023-05-03"],
      isOdd: true,
      number: 10
    },
    {
      start: "2023-05-08",
      offDays: [],
      isOdd: false,
      number: 11
    },
    {
      start: "2023-05-15",
      offDays: [],
      isOdd: true,
      number: 12
    },
    {
      start: "2023-05-22",
      offDays: ["2023-05-28"],
      isOdd: false,
      number: 13
    },
    {
      start: "2023-05-29",
      offDays: [],
      isOdd: true,
      number: 14
    },
    {
      start: "2023-06-05",
      offDays: ["2023-06-08", "2023-06-09"],
      isOdd: false,
      number: 15
    },
    {
      start: "2023-06-12",
      offDays: [],
      isOdd: true,
      number: 16
    },
    {
      start: "2023-06-19",
      offDays: ["2023-06-24", "2023-06-25"],
      isOdd: false,
      number: 17
    }
  ]
}
export { colors };
export { semesterBlueprint };
