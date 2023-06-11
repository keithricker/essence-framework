# essence-framework

An API-based front-end JS framework inspired by ViewJS and React

### [View an example project using the framework (code sandbox)](https://codesandbox.io/s/gallant-https-f8qre?file=/src/index.js)

The main purpose of Essense is to simplify the creation of API-based applications. Displaying retreived records as a list, grid, etc. The View layer is made up of *templates* and *properties,* and includes basic state management; i.e. templates that use stateful properties are re-rendered when those properties change. It is inspired by ViewJS in the sense that a lot more of your work will be done in the .html files, whereas with React, more of your time will be spent in the .js files. At the same time, it borrows the basic concepts from Reacts's use of components and state management.

Documentation is provided below. For illustrative purposes, I'm using *books* and *authors* to show how it handles sets (lists) of data.

#### Some key terms:

- **View:** A single instance of the framework. Generally speaking this will be the application, although multiple Views can certainly be employed; usually for different sections of an SPA (single page application). 

When instantiating a View, you will pass it a Factory class as an argument to the View's constructor. The factory which will be the next item we'll describe.

example (using Books as our View) :

    const BooksApi = new View(Book)
    
-  **API Factory**: The base class that talks with the API. Used for retrieving records/profiles and passing them to the View.

-  **Profile:** An instance of the Book class; i.e. an individual ***record*** or instance retrieved from the API. In our example, it would be a single book.

	example :

	    const book = {
	      title: "the Great Gatsby"
	      author: "F. Scott Fitzgerald"
	    }

    

-  **List:** A set of *profiles* as an array.

	example (a list of book records/profiles) :

	    const listOfBooks = [
		    {
		      title: "the Great Gatsby"
		      author: "F. Scott Fitzgerald"
		    },
		    {
		      title: "Harry Potter"
		      author: "JK Rowling"
		    }
	    ] 
	    
**A single instance of the framework (mostly) consists of:**

1) a **View** (an instance of the View Class)

2) A **Factory** (extending class of the API Factory. Could also be a custom class. Think of it as the "fetcher" that retrieves records from a database or an external REST API.

3) A **Config object** (Contains all of the options for creating a View)

## The View Class:

***Arguments:***
1.  a ***factory class*** (class) for retreiving the desired records,
2.  a ***config object:*** (object) key/value pairs (optional).

**The Factory:** just needs to be a class with a static method that returns an array of ***profiles*** (records). Each record being an object with key/value pairs representing the data: i.e. { author:"JK Rowling", book: "Harry Potter" }

In Object-Oriented Programming, think of the the Factory as implementing the following interface.

*Example in Typescript:*

    class Factory {
      getProfile: function;
    }

The method needs to be named "getProfiles", and it needs to accept filtering options (i.e. { author: "Mark Twain" } returns all books by Mark Twain) and return records. There is a **base Factory class** provided by the framework (View.Factory) that has a lot of options, and it is highly recommend this class be extended and modified to suit your purposes.

  

**The Config Object:** Defines how the records are to be used. It's properties are:

  

-  <strong>parent:</strong> The id of the parent element to attach the records to.

-  <strong>fields:</strong> The fields that will be pulled from the returned profile record and actually displayed (i.e. title, author, image). Example: <i>['author', 'image', description']</i> Only useful if your retrieved records has fields you won't be using (like an ID field). By default, all record fields will be displayed, so if your *fetchRecords* method already returns only the necessary fields, you're good.

-  <strong>template:</strong> a *function* that accepts property keys and values as an argument and returns an html string. ***Think props in a React component , only for this example we're using template literals (strings) as opposed to JSX.  (If you'd like to use JSX, then you can install a parser like babel that compiles it)***

#### Example Template:

    const bookDisplay = (book) => {
    
	    return `<h1> ${book.title} </h1>
	    
	    <div> by: ${book.author} </div>`
   
    }

Think of the passed-in records above like props in React. And similar to props, the template will be updated when record values change. With a bit of simplified auto-magic: No need for setState-type methods. Just changing a template's value will trigger an update of the output in the DOM.

	/* Assuming this is the record passed to the template function: */
	
    const book = {
      book.name = "Pride and Prejudice"
      book.author = "Austin, Jane"
    }
    
    /* This operation will trigger an update on the DOM: */
    
    book.author = "Jane Austin"

#### You can also use templates within templates.

    const authorTemplate = (authorRecord) => {
    
	    <h2> ${authorRecord.name} </h2>
	    
	    <h3> Titles: </h3>
    
	    ${titlesTemplate(authorRecord.titles)}
    }

</i>

  

#### And the fields we pass in:

>  <i>let record = {

&nbsp;&nbsp;title: "TomSawyer,

&nbsp;&nbsp;author: "Mark Twain",

&nbsp;&nbsp;more: <strong>(child) => {

&nbsp;&nbsp;&nbsp;&nbsp;return \`\<ul\>

&nbsp;&nbsp;&nbsp;&nbsp;\<li\>child.titles[0]\</li\>

&nbsp;&nbsp;&nbsp;&nbsp;\<li\>child.titles[1]\</li\>

&nbsp;&nbsp;&nbsp;&nbsp;\<li\>child.titles[2]\</li\>

&nbsp;&nbsp;&nbsp;&nbsp;\</ul\>\`

&nbsp;&nbsp;}</strong>

}</i>

<br  />

The view's ***execute*** function will go about rendering each record using the supplied html template and attaching them to the dom. You can also supply it with a callback function/hook that it will run in case there are any additional things you want done during excecution. It's "this" is a reference to the View with some limitations.

  

### Caching (persistence):

The view instance has a session object that keeps track of persistence. The Session.save() method (i.e. bookView.session.save), will save whatever parameters are used to produce the given query results; i.e. whatever params are sent to the API, etc. This allows for the app to have memory of whatever the user happened to be viewing last. It uses window's local storage, so it may not work in non-supporting browsers, in incognito mode, or if users have it disabled.

  

### html:

A simplified helper for inserting html in to the dom. An object of key/value pairs. i.e.

>  <br  />{

<br  />&nbsp;&nbsp;title: "&lt;h2&gt;Moby Dick&lt;/h2&gt;",

<br  />&nbsp;&nbsp;image: '&lt;img src="http://wailimage.jpg" /&gt;'

<br  />}

  

In the above example, the View will look for any dom elements matching: ***<data-html="title"***

And it will add the title's value as it's innerHTML (same with data-html="image"), resulting in:

<br  />

<br  /><i>&lt;div <strong>data-html="title"</strong>&gt;&lt;h2&gt;Moby Dick&lt;/h2&gt;&lt;/div&gt;</i>

<i>&lt;span <strong>data-html="image"</strong>&gt;&lt;img src="http://wailimage.jpg" /&gt;&lt;/span&gt;</i>

  

**Properties passed to the template will be handled similar to how React handles state.**

  

Since the View is mainly concerned with displaying lists (sets) of data, the html templating property just provides a convenient helper for working on *other dynamic elements* on the page outside of the list views. Examples might be a search box, a "more from this author" button, or pagination.

  

### Animation:

By default, the View will do a basic fadein/fadeout on the parent element when loading new child elements (records). You can override this behavior by supplying an animation configuration object with the following params:

- style (default "opacity")

- value (default 1)

- starting value (defaults to 0 for fade in)

- time (defaults to .200s)

To disable the animation altogether, you can set the view's animation property to ***false***