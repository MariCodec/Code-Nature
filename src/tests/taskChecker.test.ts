// import { checkTaskCompletion } from "../utils/taskChecker";

// describe("checkTaskCompletion", () => {
//   it("повертає true, коли HTML та CSS правильні", () => {
//     const result = checkTaskCompletion({
//       userHtml: "<h1>Привіт, HTML!</h1>",
//       correctHtml: "<h1>Привіт, HTML!</h1>",
//       userCss: "h1 { color: red; }",
//       correctCss: "h1 { color: red; }",
//     });
//     expect(result).toBe(true);
//   });

//   it("повертає false, коли HTML неправильний", () => {
//     const result = checkTaskCompletion({
//       userHtml: "<h2>Привіт</h2>",
//       correctHtml: "<h1>Привіт</h1>",
//     });
//     expect(result).toBe(false);
//   });

//   it("повертає true, якщо очікується лише CSS", () => {
//     const result = checkTaskCompletion({
//       userCss: ".box { display: flex; }",
//       correctCss: ".box { display: flex; }",
//     });
//     expect(result).toBe(true);
//   });
// });
