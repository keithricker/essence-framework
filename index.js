<!DOCTYPE html>
<html>
  <head>
    <title>Parcel Sandbox</title>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/src/styles.css" />
  </head>

  <body>
    <div id="app"></div>

    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Sintony&display=swap"
      rel="stylesheet"
    />

    <div class="body #bg-white p-5 rounded shadow">
      <h1 class="title">goodreads API</h1>

      <div class="inputs">
        <div class="dropdown">
          <button class="dropdownButton btn">Search by ></button>
          <div id="optionSelect" class="dropdown-content">
            <a class="title" href="#">title</a>
            <a class="author" href="#">author</a>
            <a class="isbn" href="#">ISBN</a>
          </div>
        </div>

        <div id="book-search-wrapper" class="#bg-white p-5 rounded shadow">
          <form id="search">
            <div class="row mb-4">
              <input
                id="searchInput"
                placeholder="Enter the title, author or ISBN"
                class="form-control form-control-underlined"
              />
            </div>
            <button
              id="searchSubmit"
              type="submit"
              class="btn btn-primary rounded-pill btn-block shadow-sm"
            >
              Search
            </button>
          </form>
        </div>
        <!-- end search wrapper -->
      </div>
      <!-- end inputs -->

      <div class="container">
        <div id="book-list" class="row mb4">
          <div id="placeholder" data-html="placeholder"></div>
          <div id="pagination" data-html="pagination"></div>
          <div id="books" class="row"></div>
        </div>
      </div>
    </div>
    <!-- end body -->

    <script src="src/index.js"></script>
  </body>
</html>
