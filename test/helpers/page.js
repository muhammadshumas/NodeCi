const puppeteer = require("puppeteer"); // used to create virtual browser (chromium)
const sessionFactory = require("../factories/session-factory");
const userFactory = require("../factories/user-factory");

class CustomPage {
  constructor(page) {
    this.page = page;
  }
  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });

    await this.page.goto("http://localhost:3000/blogs");

    // adding this extra security so that we first wait for logout button to appear and then select it below
    await this.page.waitFor("a[href='/auth/logout']");
  }

  async getContentsOf(selector) {
    return await this.$eval(selector, (el) => el.textContent);
  }

  async get(path) {
    return await this.page.evaluate(async (_path) => {
      //page.evaluate wil turn all the code inside the cb to string so we can not directly pass any arguemnts to the cb therefore page.evaluate takes second argument as list of arguments we want to pass to the cb inside page.evaluate.Here we are passing one arg i.e path
      const res = await fetch(_path, {
        method: "GET",
        credentials: "cross-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return res.json();
    }, path);
  }
  async post(path, data) {
    return await this.page.evaluate(
      async (_path, _data) => {
        const res = await fetch(_path, {
          method: "POST",
          credentials: "cross-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_data),
        });

        return res.json();
      },
      path,
      data
    );
  }
  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }
  static async build() {
    // launcing virtual browser; this represents a running browser window
    const browser = await puppeteer.launch({
      // headless false means we want to see GUI of the virtually created browser ; on the otherhand, setting it true , which is the default, will not render browser gui. Normally we dont make headless false but for the demo purpose in beginning we will do so.headless mode allows us to run faster tests
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage(); // creates/opens a new page or tab in the virtual browser

    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get(target, property) {
        return customPage[property] || browser[property] || page[property];
      },
    });
  }
}

module.exports = CustomPage;
