import { View, ApiFactory } from "./essense";
import { dom, template, listeners } from "./includes";

let searchBy, theView;

// the API call
function fetchResult(url) {
  return fetch(url)
    .then((response) => response.json())
    .then((data) => data.GoodreadsResponse || data);
}

const setProps = (props, obj) => {
  return [...new Set(...props, ...Object.keys(obj))];
};

class Author extends ApiFactory {
  async getProfile() {
    try {
      let res = await fetchResult(this.endpoint);
      this.properties = res.author;
      this.__viewProps.props = setProps(
        this.__viewProps.props,
        this.properties
      );
      return this.properties;
    } catch {
      return {};
    }
  }
}
Author.endpoint = "https://verifiablestupendousatoms.keithricker.repl.co/api";

class Book extends ApiFactory {
  constructor(...arg) {
    if (arguments[1] === true) {
      let properties = arguments[0];
      let params = { option: "books" };
      if (properties.title) {
        params.search = "title";
        params.q = properties.title;
      }
      super(params, true);
      this.properties = properties;
      return this;
    }
    arg[0].option = "books";
    const records = super(...arg);
    this.templates = template["book"];
    this.__viewProps = {
      props: [],
      template: this.templates.profile
    };
    return records;
  }
  static get defaultParams() {
    let defPar = { option: this.name, page: 1 };
    if (searchBy) defPar.search = searchBy;
    return defPar;
  }
  // Grabs the data
  async getProfile() {
    try {
      let res = await this.constructor.getProfiles(this.params);
      res = res && res.length ? res : [{}];
      this.properties = res[0];
      return this.properties;
    } catch (err) {
      return { error: err.message };
    }
  }
  static async getProfiles(params) {
    let self = this;
    params.option = "books";
    if (this.cache.get(params)) return this.cache.get(params);
    let res = await fetchResult(this.createEndpoint(params));
    if (res && res.error) return res;
    self.metaData = {
      totalResults: res.search["total-results"],
      resultsStart: res.search["results-start"],
      resultsEnd: res.search["results-end"]
    };
    res = res.search && res.search.results ? res.search.results.work || [] : [];
    let profiles = res.map((work) => {
      return { rating: work.average_rating, ...work.best_book };
    });
    this.cache.set(params, profiles);
    return profiles;
  }
}
Book.endpoint = "https://verifiablestupendousatoms.keithricker.repl.co/api";
Book.metaData = {};
// the properties used in the template for the profile. These are passed to the View component; i.e. {{title}} {{author}} etc.
Book.__properties = ["title", "author", "image", "rating"];
Book.templates = {
  list: template.book.list,
  profile: template.book.profile
};

// restore previous state if one exists
function restoreFromParams(params) {
  if (Object.keys(params).length < 2) return;
  theView = new View(Book);
  async function hook(params) {
    let profiles = this.data;
    let page = (this.metaData.page = params.page || this.metaData.page);

    if (profiles.error)
      this.html.placeholder = new View.Element({
        markup: template.error(),
        template: template.error,
        vars: {},
        name: "placeholder"
      });
    else if (!profiles || !profiles.length)
      this.html.placeholder = new View.Element({
        markup: template.noResults(),
        template: template.noResults,
        name: "placeholder"
      });
    this.html.pagination = new View.Element({
      markup: template.book.pagination({
        page,
        total: this.metaData.totalResults
      }),
      template: template.book.pagination,
      vars: { page, total: this.metaData.totalResults },
      name: "pagination"
    });
    if (params.search === "author") {
      let auth = await new Author({ author: params.q });
      if (Object.keys(auth).length) {
        let authTemp = (author) =>
          `<a href="${author.properties.link}">View ${author.properties.name}'s profile on goodreads</a><div>(Note: some external links may not work from codepen)</div>`;
        this.html.placeholder = new View.Element({
          name: "placeholder",
          markup: authTemp(auth),
          template: authTemp,
          vars: auth
        });
      }
    }
  }
  let theBookList = document.querySelector("#book-list");
  theView.execute(params, hook).then((res) => (theBookList.style.opacity = 1));
}

let session = View.storage.get("session");
if (session) restoreFromParams(session);

/* ADDING THE EVENT LISTENERS */
// Pagination
document
  .querySelector("body")
  .addEventListener("click", listeners(theView).pagination);

// Search select dropdowns
dom.dropdown.addEventListener("click", function () {
  document.getElementById("optionSelect").classList.toggle("show");
});

Array(...dom.dropdownOptions).forEach((dd) => {
  dd.addEventListener("click", (e) => {
    e.preventDefault();
    searchBy = e.target.innerText;
  });
});

dom.search.addEventListener("submit", listeners(theView).searchSubmit);

/* 
- When the user clicks on the button, toggle between hiding and showing dropdown content
- Close the dropdown menu if the user clicks outside of it */
window.onclick = listeners(theView).dropDown;
