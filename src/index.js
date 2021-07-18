/*

THIS IS INTENDED AS A DEMONSTRATION OF A CUSTOM JAVASCRIPT FRONTEND FRAMEWORK. THE MAIN FUNCTIONALITY OF THE FRAMEWORK IS TO WORK WITH RETREIVED RECORDS FROM AN API AND DISPLAY THEM AS A LIST, GRID, ETC. FOR ILLUSTRATIVE PURPOSES, WE'RE USING THE GOODREADS API, WHICH GIVES YOU THE ABILITY TO SEARCH BOOKS BY TITLE, AUTHOR OR ISBN, AND IT DISPLAYS THE RESULTS IN A GRID FORMAT. THE PURPOSE OF THIS IS TO DEMONSTRATE MY ABILITY TO USE OBJECT-ORIENTED JAVASCRIPT PROGRAMMING TO CONSTRUCT A COMPLEX FRAMEWORK AND API. BELOW I HAVE A DESCRIPTION OF THE FRAMEWORK, STARTING WITH KEY TERMS.

KEY:

option: The entity being searched; author or book in this app. Athough the app only returns books, in the background the author is looked up in order to allow user to view the author's profile when searching books by author.

searchBy: the first item in the dropdown search: title, author, or ISBN

theView: The view we're using for this app.

profile: An individual record or instance of the Book/Author classes. Classes and static properties, by contrast, return an array of books (or authors) as opposed to a book instance that retreives one record.

list: A static property of the Author or Book class. Gives us "Book" and "Book.list" as opposed to separate "Book" and "BookS" classes.

View Factory: the base class used for retreived entities. Main purpose is to retreive records and pass them to the View.

dom: Just a collection of key dom elements used in this pen.


ABOUT THE FRAMEWORK:

The framework mostly consists of:
1) The View class (below)
2) A factory class
3) A component object

The View Class: Takes a factory class, and a parameters object of key/value pairs as it's arguments (optional). The factory class just needs to have a method that returns an array of records (in this case retreived from the goodreads API). Each record is an object with key/value pairs representing the data: i.e. { author:"JK Rowling", book: "Harry Potter" } 

The Factory: As described above, it needs to have a "getProfiles" method that accepts filter options (params) and return records. The one used in this exercise is the Book class. There is a base Factory class provided by the framework (View.Factory) that has a lot of options (which the Book class extends), but conceivably, as long as it returns records, you can use anything. The factory might be overkill for simpler projects.

The Component Object: Defines how the records are to be used. It's properties are:
- parent: The id of the parent element to attach the records to.
- props: The fields that will be used (i.e. title, author, image); this property is more descriptive than functional (like a schema)
- template: a function that takes the prop keys and values as an argument and returns an html string

Example: 
let record = { 
  title:"TomSawyer", author:"Mark Twain" 
}
let template = (record) => {
  return `<h2>${record.title}</h2>
  <div>by: ${record.author}</div>`
}
The view's "execute" function will go about rendering each record using the supplied html template and attaching them to the dom. You can also supply it with a callback funciton/hook that it will run in case there are any additional things you want done during excecution. It's "this" is a reference to the View with some limitations.

Caching: The view object has a session.save() method (i.e. bookView.session.save), which will save whatever parameters are used to produce the given query results; i.e. whatever params are sent to the API, etc. This allows for the app to have memory of whatever the user happened to be viewing last. It uses window's local storage, so it may not work in non-supporting browsers, in incognito mode, or if users have it disabled.

The View html property: A very simplified and convenient helper for inserting html in to the dom. An object of key/value pairs. i.e. 
{ 
  title: "<h2>Moby Dick</h2>", 
  image:'<img src="http://wailimage.jpg">'
}

View will look for any dom elements matching: <data-html="title"
And it will add the title's value as it's innerHTML, resulting in:
<div data-html="title"><h2>Moby Dick</h2></div>

This is useful when targeting elements outside of the list results. An example of this in action would be the pagination element in our example goodreads API app.

Animation: By default, the View will do a basic fadein/fadeout on the parent element when loading new child elements (records). You can override this behavior by supplying an animation configuration object with the following params: 
- style (default "opacity")
- value (default 1)
- starting value (defaults to 0 for fade in)
- time (defaults to .200s)

To disable the animation altogether, you can set the view's animation property to false

*/

/* in a multipage setup, these would be our imports/requires */
let {View,ViewFactory,Author,Book,dom,template,newClass,newInstance,listeners,lowerFirst} = includes()

let searchBy, theView

// restore previous state if one exists
function restoreFromParams(params) {
  if (Object.keys(params).length < 2) return
  theView = new View(Book)
  async function hook(params) {
    if (params.search === 'author') {
      let auth = await new Author({author:params.q})
      if (Object.keys(auth).length) {
        let authTemp = (author) => `<a href="${author.properties.link}">View ${author.properties.name}'s profile on goodreads</a><div>(Note: some external links may not work from codepen)</div>`
        this.html.placeholder = new View.Element({
          name: 'placeholder',
          markup: authTemp(auth),
          template: authTemp,
          vars:auth,
          name:'placeholder'
        })
      }
    }     
  } 
  let theBookList = document.querySelector('#book-list')
  theView.execute(params,hook)
  .then(res => theBookList.style.opacity = 1)
}

let session = View.storage.get('session')
if (session) restoreFromParams(session)

/* ADDING THE EVENT LISTENERS */
// Pagination
document.querySelector('body').addEventListener('click',listeners.pagination)

// Search select dropdowns
dom.dropdown.addEventListener('click',function() {
  document.getElementById("optionSelect").classList.toggle("show");
})

Array(...dom.dropdownOptions).forEach(dd => {
  dd.addEventListener('click',e => {
    e.preventDefault()
    searchBy = e.target.innerText
  })
})

dom.search.addEventListener('submit',listeners.searchSubmit)

/* 
- When the user clicks on the button, toggle between hiding and showing dropdown content
- Close the dropdown menu if the user clicks outside of it */
window.onclick = listeners.dropDown 

// Just a work-around to make due with not having ability to break code up in to separate files. Includes returns an object who's properties would have otherwise been requires/imports.

function includes() {
  
  /************** BEGIN FRAMEWORK ************/
  
  // A factory for Views:
  const ViewFactory = newClass(class {
    constructor(params,bypass=false) {
      // Allows us to keep track of the instances
      this.constructor.instances.push(this)
      this.name = lowerFirst(this.constructor.name)
      // Params are the "search" or "filter" options used when fetching records
      this.params = params 
      // Properties are the fields we're retreiving; i.e. "image", "title", and "rating"
      this.properties = this.properties || {}
      // The html templates used when displaying the data. Allows for using separate templates depending on how it's displayed: i.e. "preview view" or "full view"
      this.templates = template[this.name]
      this.__viewProps = Object.assign({ 
        props: [],
        template: this.templates.full
      },this.__viewProps || {})
      if (!params || bypass===true) return
      return this.getProfile().then(res => newInstance(this))
    }
    // outputs a set of props you can pass to a new View
    get viewProps() {
      
      if (Object.keys(this.properties).length) 
        this.__viewProps.props = [...new Set([...this.__viewProps.props,...Object.keys(this.properties)])]      
      return {...this.__viewProps,props:[...this.__viewProps.props]}
    }
    getProfile() {}
    get component() {
      let comp = {parent:lowerFirst(this.name), ...this.viewProps}
      View.component = comp
      return comp
    }
    get endpoint() {
      return this.constructor.endpoint(this.params)
    }
    static get listName() {
      return lowerFirst(this.name)+'List'
    }
    // View already has it's own caching, but this one is more specific to this application.
    static cache = {
      get: function(params) {
        if (!(this._cache && this.__cache[objectToString(params)])) 
          return
        let cache = self.__cache[objectToString(params)]
        let profiles = cache.profiles
        this.metaData = cache.metadata
        return profiles
      },
      set: function(params,profiles) {       
        if (!self.__cache) self.__cache = {}
        self.__cache[objectToString(params)] = { 
          profiles, metaData:self.metaData
        }
      }
    }
    static get defaultParams() {
      let defPar = { option:this.name, page:1 }
      if (searchBy) defPar.search = searchBy
      return defPar
    }
    // another prop factory, but specific to the class.
    static viewProps(params) {
      params = {...this.defaultParams,...params || {}}
      let self = this
      let vps = {
        parent:lowerFirst(this.name),
        data: [],
        html: {},
        params,
        metaData: {},
        hooks: {}
      }
      if (this.getProfiles) vps.hooks.execute = async function(hook) {
        let metaData = () => self.metaData || {}
        let profiles = await self.getProfiles(params) 
        vps.metaData = metaData()
        let page = vps.metaData.page = params.page || metaData().page
        this.vps = vps
        vps.html.pagination = new View.Element({
          markup: template.book.pagination({page,total:vps.metaData.totalResults}),
          template: template.book.pagination,
          vars: {page,total:vps.metaData.totalResults},
          name: 'pagination'
        })
        vps.html.placeholder = new View.Element({ markup: '', name:'placeholder' })
        if (hook) await hook.call(this,params)
        vps.data = profiles
        if (profiles.error)
          vps.html.placeholder = new View.Element({ 
            markup: template.error(),
            template: template.error,
            vars: {},
            name:'placeholder'
          })
        else if (!profiles || !profiles.length)
          vps.html.placeholder = new View.Element({ 
            markup: template.noResults(),
            template: template.noResults,
            name: 'placeholder'
          })
      }.bind(vps)
      Object.assign(this,vps)
      return vps
    }
    // Takes the data input from the search form, and creates an api endpoint to the replit server and grab the data
    static endpoint(params) {
      let url = new URL(config.endpoint)
      params = {...this.defaultParams,...params}
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      })
      return url.toString()
    }
    static list(params) {
      let self = this
      params.option = 'books'
      let list = Reflect.ownKeys(ViewFactory).reduce((ob,key) => {
        if (key !== 'constructor' && typeof ViewFactory[key] === 'function')
          ob[key] = ViewFactory[key].bind(this,params)
        return ob
      },{})
      let componentName = lowerFirst(self.name)
      list.component = function() {}
      list.component.props = {
        parent:componentName,
        props: this.__properties,
        template: template[componentName].list
      }
      return list
    }
    static __properties = []
  })
  ViewFactory.instances = []

  // The View Class :
  class View {
    constructor(factory,params) {
      const self = this
      this.factory = factory
      this.params = params
      this.children = []
      this.session = {
        get() { return View.storage.get('session') },
        save(par) { return View.storage.set('session',par || this.params) }
      }
      this.__animation = {
        style: 'opacity',
        value: '1',
        transition: 'all',
        time: '.200s',
        start: 0
      }
      this.hooks = {
        loading: function() {
          let child = document.getElementById('loading')
          if (child) {
            child.style.opacity = 0.8
            return
          }
          if (!this.html || !this.html.loading || !this.html.loading.template || !this.__parentElement) return
          let loadingHtml = this.html.loading.template()
          let parent = this.__parentElement.parentNode
          parent.style.position = 'relative'
          
          child = View.Element.create(loadingHtml)
     
          this.hooks.loading.element = child
          if (this.html.loading.style) Object.assign(child.style,this.html.loading.style)
          parent.appendChild(child)
          child.style.opacity = 0.8
                    
        }.bind(self)
      }
      this.hooks.loading.undo = function() {
        let loader = this.hooks.loading.element
        loader.style.opacity = 0
        setTimeout(() => {
          self.__parentElement.parentNode.removeChild(loader)
        }, 500)
      }.bind(self)
      this.html = {
        loading: new View.Element({
          name: 'loading',
          template() {
            return `<h3 id="loading">Loading ...</h3>`
          },
          style: {
            opacity:0,
            transition:'all .200s',
            position:'absolute',
            width:'50%',
            ['text-align']:'center',
            ['margin-left']:'auto',
            ['margin-right']:'auto',
            left:0,
            right:0,
            color:'#f9f9f9',
            background:'#777',
            padding:'5px',
            ['border-radius']:'7px'
          }
        })
      }
    }
    get parent() {
      return this.__parent
    }
    set parent(parent) {
      this.__parent = parent
      let parentElement = this.__parentElement = document.getElementById(parent+'s')
      let { style,value,transition,time } = this.animation
      parentElement.style[style] = value
      parentElement.style.transition = transition+' '+time
    }
    set component(comp) {
      Object.assign(this,comp.props)
      this.__component = comp
      return true
    }
    get component() {
      return this.__component
    }
    async execute(params,cb) {
      if (typeof params === 'object') this.params = params
      else params = this.params
      if (typeof arguments[0] === 'function') cb = arguments[0]
      
      let list = this.factory.list(params)
      if (!this.component)
        this.component = list.component
      
      if (this.hooks.loading) await this.hooks.loading()
      
      let props = await list.viewProps()
      if (props.hooks) this.hooks = Object.assign(this.hooks || {}, props.hooks)
      if (this.hooks.execute) await this.hooks.execute(cb)
      if (props.metaData) this.metaData = props.metaData
      let name = lowerFirst(this.factory.name)
      if (props.data)
        this.children = props.data
  
      if (props.html && this.html)
        Object.assign(this.html,props.html)
      if (this.html) this.html.render()
      let {style,time,start,value} = this.animation
      let parent = this.__parentElement
      parent.style[style] = start
      
      setTimeout(() => {
        parent.innerHTML = ''
        this.children.forEach(comp => {
          let child = View.Element.create(this.template(comp))
          parent.appendChild(child)
        })
        parent.style[style] = value
        if (this.hooks.loading && this.hooks.loading.undo) this.hooks.loading.undo()  
      }, time)
    }
    get html() {
      return this.__html
    }
    set html(obj) {
      this.__html = obj
      Object.getPrototypeOf(this.__html).render = function(props={}) {
        Object.keys(this).forEach(key => {
          if (props[key]) this[key].vars = props[key]
          this[key].render()
        })  
      }
      return true
    }
    restore(params,hook) {
      params = params || this.params
      this.params = params
      if (Object.keys(params).length < 2) return
      params.page = params.page || 1
      this.execute(params,hook)
    }
    get animation() {
      let animation = this.__animation
      let time = animation.time
      let theTime = time || 400, unit
      
      if (time.indexOf('ms') === time.length-2) unit = 'ms'
      else if (time.indexOf('s') === time.length-1) unit = 's'
      if (unit) {
        theTime = time.split(unit)[0].trim()
        let timeBy = unit === 's' ? 1500 : 1.5
        let parseMethod = isNaN(parseInt(theTime)) ? parseFloat : parseInt
        theTime = parseMethod(theTime) * timeBy
      }
      return { ...animation,time:theTime }
    }
    set animation(an) {
      if (an === false)
        this.__animation.time = 0
      else if (typeof an === 'object') this.__animation = Object.assign(this.__animation,an)
      return true
    }
  }
  View.Factory = ViewFactory
  View.Element = class Element {
    constructor(props) {
      if (typeof props === 'object') Object.assign(this,props)
    }
    render(props) {
      let self = this
      if (typeof props === 'object') Object.assign(this,props)
      if (this.template && this.vars)
        this.markup = this.template(this.vars)

      if (!this.instances.length && this.parent) {
        let el = this.create(this.markup)
        this.parent.appendChild(el)
      }
      else this.instances.forEach(el => { 
        el.innerHTML = self.markup
      })
    }
    create(html) { return View.Element.create(html, this.name) }
    get instances() {
      return document.querySelectorAll(`[data-html="${this.name}"]`)
    }
    get vars() {
      return this.__vars
    }
    set vars(vrs) {
      if (!vrs) {
        this.__vars = {}; return true
      }
      let __vars = {...vrs}
      Object.keys(vrs).forEach(vr => delete vrs[vr])
      Object.setPrototypeOf(vrs,new Proxy(__vars, {
        set(ob,prop,val) { ob[prop] = val; self.render(); return true }
      }))
      if (this.__vars) {
        this.__vars = vrs
        this.render()
      } else {
        this.__vars = vrs
      }
      return true
    }
    static create(html,name) {
      let el = document.createElement('div')
      el.innerHTML = html
      if (name) el.setAttribute('data-html',name)
      return el.firstChild
    }
  }
  View.storage = {
    set: (key,val) => {
      try {
        if (typeof val !== 'string') val = JSON.stringify(val)
        return window.localStorage.setItem(key,val)
      } catch { console.error('local storage not enabled') }
    },
    get: (key,val) => {
      try {
        let item = window.localStorage.getItem(key)
        try { 
          parsed = JSON.parse(item)
          if (typeof parsed === 'object') return parsed
        } catch { return item }
      } catch { console.error('local storage not enabled.') }
    }
  } 
  
  /************** End Framework ************/
  
  // the API call
  function fetchResult(url) {
    return fetch(url)
      .then(response => response.json())
      .then(data => data.GoodreadsResponse || data);
  }
  const config = {
    endpoint: 'https://verifiablestupendousatoms.keithricker.repl.co/api'
  }
  const setProps = (props,obj) => {
    return [...new Set(...props,...Object.keys(obj))]
  }

  class Author extends ViewFactory {
    async getProfile() {
      try {
        let res = await fetchResult(this.endpoint)
        this.properties = res.author
        this.__viewProps.props = setProps(this.__viewProps.props,this.properties)
        return this.properties
      } catch { return {} }
    }
  }
  
  class Book extends ViewFactory {
    constructor(...arg) {
      
      if (arguments[1] === true) {
        let properties = arguments[0]
        let params = { option: 'books'}
        if (properties.title) {
          params.search ='title'
          params.q = properties.title
        }
        super(params,true)
        this.properties = properties
        return this
      }
      arg[0].option = 'books'
      return super(...arg)

    }
    // Grabs the data 
    async getProfile() {
      try {
        let res = await this.constructor.getProfiles(this.params)
        res = (res && res.length) ? res : [{}]
        this.properties = res[0]
        return this.properties
      } catch(err) { return { error:err.message } }
    }
    static metaData = {}
    // the properties used in the template for the profile. These are passed to the View component; i.e. {{title}} {{author}} etc.
    static __properties = ['title','author','image','rating']
    static async getProfiles(params) {
      let self = this
      params.option = 'books'
      if (this.cache.get(params)) return this.cache.get(params)
      let res = await fetchResult(this.endpoint(params))
      if (res && res.error) return res
      self.metaData = {
        totalResults:res.search['total-results'], 
        resultsStart:res.search['results-start'], 
        resultsEnd:res.search['results-end']
      }
      res = (res.search && res.search.results) ? res.search.results.work || [] : []
      let profiles = res.map(work => {
        return { rating:work.average_rating,...work.best_book }
      }) 
      this.cache.set(params,profiles)
      return profiles
    }

  }
  
  function lowerFirst(word) {
    return word.charAt(0).toLowerCase()+word.slice(1)
  }

  const dom = {
    book: document.querySelector('.book'),
    dropdown: document.querySelector('.dropdown'),
    dropdownButton: document.querySelector('dropdownButton'),
    dropdownOptions: document.querySelectorAll('.dropdown-content'),
    search: document.querySelector('#search'),
    searchInput: document.querySelector('#searchInput'),
    searchSubmit: document.querySelector('#searchSubmit'),
    placeholder: document.querySelector("#placeholder"),
    pagination: document.querySelector("#pagination"),
  }
  
  const listeners = {
    pagination(e) {
      if (e.target.className !== 'next' && e.target.className !== 'prev') return
      e.preventDefault()
      let prevNext = (e.target.className === 'next'|| e.target.className === 'prev') ? e.target.className : undefined
      let page = prevNext === 'next' ? theView.metaData.page+1 : theView.metaData.page-1
      
      if (page === 0) page = 1
      if (page > theView.metaData.totalResults) { page = page - 1 }
      theView.metaData.page = page
      let params = {...theView.params,page}
      View.storage.set('session',params)
      theView.factory.getProfiles(params).then(newResults => {
        if (newResults.error) {
          theView.placeholder = template.error()
          theView.list = []
        } else if (!newResults || !newResults.length) {
          theView.placeholder = template.noResults()
          theView.list = []
        } else theView.children = newResults
        theView.params = params
        theView.html.pagination.vars = {page,total:theView.factory.metaData.totalResults}
        theView.execute()
      })
    },
    searchSubmit(e) {
      e.preventDefault()
      document.querySelector('#books').scrollIntoView({
        behavior: 'smooth'
      });
      let searchTerm = dom.searchInput.value
      let params = {search:searchBy,q:searchTerm}
      View.storage.set('session',params)
      return restoreFromParams(params)
    },
    dropDown(event) {
      if (!event.target.matches('.dropdownButton')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }   
    }
  }

  const template = {
    book: {
      list: (replace={}) => `<div class="book #bg-white rounded col-sm-4">
          <div class = "row">
            <div class = "col-3">
              <div class="img">
                <img src="${replace.image_url}" alt="" />
              </div>
            </div>
            <div class = "col-9">
              <h4 class='title'>${replace.title}</h4>
              <div class="rating">
                average user rating: ${replace.rating}
              </div>
            </div>
          </div>
        </div>`,
      profile: () => ``,
      pagination: (replace) =>`<a class="prev" href="#">&lt;</a>   ${replace.page} of ${replace.total}  <a class="next" href="#">&gt;</a>`,
    },
    author: {
      full: () => ``,
      list: () => ``
    },
    error: () => `<h2>There was an error processing your request. Feel free to reach out our administrators at XXXXX. We apologize for the inconvenience.</h2>`,
    noResults: () => `<h2>There are no results for your search, or there was a problem with your request. Please try again using different search terms.`
  }
  
  function objectToString(obj) {
    return JSON.stringify(Object.keys(obj).sort().reduce((ob,key) => {
      ob[key] = obj[key]
      return ob
    },{}))
  }
  
  /* These are just some wrappers I like to use that format some of the class fields to my personal liking. Tney don't serve any useful function otherwise. */ 
  
  function newClass(cls) {
    Reflect.ownKeys(cls.prototype).forEach(key => {
      Object.defineProperty(cls.prototype,key,{...Object.getOwnPropertyDescriptor(cls.prototype,key),enumerable:true})
    })
    return cls
  }
  function newInstance(instance) {
    Reflect.ownKeys(instance).forEach(key => {
      let desc = Object.getOwnPropertyDescriptor(instance,key)
      if (key.indexOf('__') === 0)
        Object.defineProperty(instance,key,{...desc,enumerable:false})
      else if (desc.enumerable === false) Object.defineProperty(instance,key,{...desc,enumerable:true})
    })
    return instance
  }
 
  /* in a multipage setup these would be our exports */
  return {View,ViewFactory,Author,Book,dom,template,listeners,lowerFirst}
}
