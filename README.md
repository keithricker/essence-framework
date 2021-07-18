# essence-framework
An API-based front-end JS framework inspired by ViewJS and Angular

The main purpose of Essense is to simplify the creation of API-based applications. Displaying retreived records as a list, grid, etc. Documentation is provided below. For illustrative purposes, I am using books and authors.

Some key terms:

***View:*** A single instance of the framework. Generally speaking this will be the application, although multiple Views can certainly be employed; usually for different sections of an SPA (single page application).
***Profile:*** An individual record or instance retreived from the API. The "li" within the "ul", to borrow an htm term. 
***List:*** A set (array) of profiles.
***View Factory:*** the base class that talks with the API. Used for retreiving records/profiles and passing them to the View. 

The single instance of the framework mostly consists of:
1) A View (an instance of the View Class)
2) A Factory (instance of the View Factory. Could also be a custom class that retreives records from an API)
3) A Config object (Contains all of the options for creating a View)


**The View Class:** 
Arguments: 
1. A factory class for retreiving the desired records,
2. Parameters object: key/value pairs (optional). 

**The Factory** The factory just needs to be a class with a method that returns an array of records. Each record being an object with key/value pairs representing the data: i.e. { author:"JK Rowling", book: "Harry Potter" } 

The method needs to be named "getProfiles", and it needs to accept filtering options (i.e. { author: "Mark Twain" }) and return records. There is a base Factory class provided by the framework (View.Factory) that has a lot of options, and it is highly recommend this class be extended and modified to suit your puproses.

**The Config Object:** Defines how the records are to be used. It's properties are:
***- parent:*** The id of the parent element to attach the records to.
***- props:*** The fields that will be used (i.e. title, author, image); this property is more descriptive than functional (like a schema), and defines the terms that will be used.
***- template:*** a function that takes the prop keys and values as an argument and returns an html string

***Example Template:***

<code>
// sample record: { title:"TomSawyer", author:"Mark Twain"}
let template = (record) => `<h2>$\{record.title\}</h2><div>by: ${record.author}</div>`
</code>

When you see records and properties as shown above, they will in many ways be handled similar to how React handles state.

The view's ***execute*** function will go about rendering each record using the supplied html template and attaching them to the dom. You can also supply it with a callback funciton/hook that it will run in case there are any additional things you want done during excecution. It's "this" is a reference to the View with some limitations.

**Caching (persistence):** The view object has a session object that keeps track of persistence. The Session.save() method (i.e. bookView.session.save), will save whatever parameters are used to produce the given query results; i.e. whatever params are sent to the API, etc. This allows for the app to have memory of whatever the user happened to be viewing last. It uses window's local storage, so it may not work in non-supporting browsers, in incognito mode, or if users have it disabled.

**html:** A simplified helper for inserting html in to the dom. An object of key/value pairs. i.e. 
{ 
  title: "<h2>Moby Dick</h2>", 
  image:'<img src="http://wailimage.jpg">'
}
In the above example, the View will look for any dom elements matching: ***<data-html="title"***
And it will add the title's value as it's innerHTML, resulting in:
`<div data-html="title"><h2>Moby Dick</h2></div>`

*Another example where properties passed to the template will be handled similar to how React handles state.*

Since the View is mainly concerned with displaying lists (sets) of data, this just provides a hanndy helper for working on other dynamic elements on the page outside of the list views.

**Animation:** By default, the View will do a basic fadein/fadeout on the parent element when loading new child elements (records). You can override this behavior by supplying an animation configuration object with the following params: 
- style (default "opacity")
- value (default 1)
- starting value (defaults to 0 for fade in)
- time (defaults to .200s)
To disable the animation altogether, you can set the view's animation property to ***false***


