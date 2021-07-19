// A factory for communicating with APIs:
const ApiFactory = newClass(class {
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
    let list = Reflect.ownKeys(ApiFactory).reduce((ob,key) => {
    if (key !== 'constructor' && typeof ApiFactory[key] === 'function')
        ob[key] = ApiFactory[key].bind(this,params)
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
ApiFactory.instances = []

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
    
    if (time.indexOf('ms') === time.length-2) 
      unit = 'ms'
    else if (time.indexOf('s') === time.length-1) 
      unit = 's'
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
    else if (typeof an === 'object') 
      this.__animation = Object.assign(this.__animation,an)
    return true
  }
}
View.Factory = ApiFactory
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
  create(html) { 
    return View.Element.create(html, this.name) 
  }
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
      set(ob,prop,val) { 
        ob[prop] = val; self.render(); return true 
      }
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

function lowerFirst(word) {
  return word.charAt(0).toLowerCase()+word.slice(1)
}

function objectToString(obj) {
  return JSON.stringify(Object.keys(obj).sort().reduce((ob,key) => {
    ob[key] = obj[key]
    return ob
  },{}))
}
