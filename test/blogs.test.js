const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

// Decribe statements are used for things that are common in some tests
describe("When in Logged in", () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("Can see blog create form", async () => {
    const label = await page.getContentsOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("And using valid Inputs", () => {
    beforeEach(async () => {
      await page.type(".title input", "My title"); // page.type() is used for typing something into an input,It takes 2 args; 1st is the input in which we want to type and second is our content that we want to enter

      await page.type(".content input", "My content");

      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const formTitle = await page.getContentsOf("form h5");

      expect(formTitle).toEqual("Please confirm your entries");
    });
    test("Submitting then saving add blog to the index page", async () => {
      await page.click("button.green");

      await page.waitFor(".card"); //this wait for is used because we make a backend request and page refresh so when ever this happens we have to use waitfor

      const cardTitle = await page.getContentsOf(".card-title");
      const cardContent = await page.getContentsOf(".card p");

      expect(cardTitle).toEqual("My title");
      expect(cardContent).toEqual("My content");
    });
  });

  describe("And using invalid inputs", () => {
    beforeEach(async () => {
      await page.click("form button");
    });
    test("The form shows an error message", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

describe("When user is not logged in", () => {
  const actions = [
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "T",
        content: "C",
      },
    },
    {
      method: "get",
      path: "/api/blogs",
    },
  ];

  test("Blog related actions are prohibited", async () => {
    const results = await page.execRequests(actions);

    for (let result of results) {
      expect(result).toEqual({ error: "You must log in!" });
    }
  });

  // test("User can not create blog post", async () => {
  //   const result = await page.post("/api/blogs", {
  //     title: "Try to create post",
  //     content: "When not logged in trying to create post",
  //   });

  //   expect(result).toEqual({ error: "You must log in!" });
  // });

  // test("User can not get a list of post", async () => {
  //   const result = await page.get("/api/blogs");

  //   expect(result).toEqual({ error: "You must log in!" });
  // });
});
