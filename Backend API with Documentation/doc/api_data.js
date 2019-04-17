define({ "api": [
  {
    "type": "GET",
    "url": "/api/Author/?auth_name=Value",
    "title": "Find an author by name",
    "name": "Find_author_by_name",
    "group": "Author",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "name-not-found",
            "description": "<p>Author could not be found</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 404 Not Found",
          "content": "HTTP/1.1 404 Not Found\n{\n\"success\": false,\n\"Message\":\"Author  not  found !\"\n}",
          "type": "JSON"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "auth_name",
            "description": "<p>Author Name</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "Author",
            "description": "<p>data for the required Author</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n\n {\n        \"_id\" : ObjectId(\"5c9284d5e0a57a14e749981a\"),\n        \"BookId\" : [\n                \"5c91157331557ebe471e0a12\"\n        ],\n        \"AuthorId\" : \"5c91157301d63f812a141932\",\n        \"AuthorName\" : \"Alberta Bean\",\n        \"Photo\" : \"http://placehold.it/32x32\",\n        \"FollowingUserId\" : [\n                \"5c9132dd99a8a3609cca3406\",\n                \"5c91344d99a8a3609cca3406\"\n        ]\n  }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Authors.js",
    "groupTitle": "Author"
  },
  {
    "type": "GET",
    "url": "/api/Author/byid/?auth_id=Value",
    "title": "Get info about author by id",
    "name": "Get_info_about_author_by_id",
    "group": "Author",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "id-not-found",
            "description": "<p>Author could not be found</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 404 Not Found",
          "content": "HTTP/1.1 404 Not Found\n{\n\"success\": false,\n\"Message\":\"Author  not  found !\"\n}",
          "type": "JSON"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "auth_id",
            "description": "<p>Author ID</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "Author",
            "description": "<p>data for the required Author</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n\n   {\n          \"_id\" : ObjectId(\"5c9284d5e0a57a14e749981a\"),\n          \"BookId\" : [\n                  \"5c91157331557ebe471e0a12\"\n          ],\n          \"AuthorId\" : \"5c91157301d63f812a141932\",\n          \"AuthorName\" : \"Alberta Bean\",\n          \"Photo\" : \"http://placehold.it/32x32\",\n          \"FollowingUserId\" : [\n                  \"5c9132dd99a8a3609cca3406\",\n                  \"5c91344d99a8a3609cca3406\"\n          ]\n    }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Authors.js",
    "groupTitle": "Author"
  },
  {
    "type": "POST",
    "url": "/api/Authors/unFollow",
    "title": "Unfollow an Author",
    "name": "Unfollow_Author",
    "group": "Author",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "id-not-found",
            "description": "<p>The<code>myuserId</code> was not found.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 404 Not Found",
          "content": " HTTP/1.1 404 Not Found\n{\n\"success\": false,\n\"Message\":\"Author Id not  found !\"\n}",
          "type": "JSON"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "200",
            "optional": false,
            "field": "UNFollow",
            "description": "<p>Successful</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n     {\n        \"success\": true,\n        \"Message\":\"Successfully done\"\n     }",
          "type": "JSON"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "myuserId",
            "description": "<p>GoodReads User ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "auth_id",
            "description": "<p>GoodReads Author ID</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./Authors.js",
    "groupTitle": "Author"
  },
  {
    "type": "POST",
    "url": "/api/Authors/Follow",
    "title": "follow an Author",
    "name": "follow_Author",
    "group": "Author",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "id-not-found",
            "description": "<p>The<code>myuserId</code> was not found.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 404 Not Found",
          "content": " HTTP/1.1 404 Not Found\n{\n\"success\": false,\n\"Message\":\"Author Id not  found !\"\n}",
          "type": "JSON"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "200",
            "optional": false,
            "field": "UNFollow",
            "description": "<p>Successful</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n     {\n        \"success\": true,\n        \"Message\":\"Successfully done\"\n     }",
          "type": "JSON"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "myuserId",
            "description": "<p>GoodReads User ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "auth_id",
            "description": "<p>GoodReads Author ID</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./Authors.js",
    "groupTitle": "Author"
  },
  {
    "type": "GET",
    "url": "/book/find",
    "title": "Find book by title, author, or ISBN. Gets found book",
    "version": "0.0.0",
    "name": "FindBooks",
    "group": "Books",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Title",
            "description": "<p>Book title to Search.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Author",
            "description": "<p>Book Author to Search.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "ISBN",
            "description": "<p>Book ISBN to Search.</p>"
          },
          {
            "group": "Parameter",
            "type": "Select",
            "optional": true,
            "field": "Select",
            "defaultValue": "all",
            "description": "<p>Field to search,(default is 'all').</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "Page",
            "defaultValue": "1",
            "description": "<p>Which page of results to show (default 1).</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "BookId",
            "description": "<p>Book-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Title",
            "description": "<p>Book-Title.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "AuthorId",
            "description": "<p>Author-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ISBN",
            "description": "<p>Book-ISBN.</p>"
          },
          {
            "group": "Success 200",
            "type": "DatePicker",
            "optional": false,
            "field": "Published",
            "description": "<p>Date when book was published.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Publisher",
            "description": "<p>The name of the book's publisher.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "Pages",
            "description": "<p>Number of book pages.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Description",
            "description": "<p>Small breifing about the book's contents.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Cover",
            "description": "<p>Link that holds the book's cover picture.</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "Store",
            "description": "<p>Links for webpages that store the book.</p>"
          },
          {
            "group": "Success 200",
            "type": "Select",
            "optional": false,
            "field": "ReadStatus",
            "description": "<p>Read, Currently Reading, or Want to Read.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "BookRating",
            "description": "<p>Rating for the book.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n  \"BookId\":\"5c911452bbfd1717b8a7a169\",\n  \"Title\":\"sit\",\n  \"AuthorId\":\"5c911452a48b42bb84bc785c\",\n  \"ISBN\":\"5c911452ce18b2b3276d4b45\",\n  \"Published\":\"2001-05-08 \",\n  \"Publisher\":\"COREPAN\",\n  \"Pages\":226.0,\n  \"Description\":\"Ad officia duis enim occaecat ullamco aliqua sint mollit non ea et ea aliqua ea. Reprehenderit eu ut in elit ex eu. Excepteur Lorem est ad amet sunt.\\r\\n\",\n  \"Cover\":\"http://placehold.it/32x32\",\n  \"Store\":[\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\"],\n  \"ReadStatus\":\"Read\",\n  \"BookRating\":5.0,\n  \"Genre\":\"Horror\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Book-not-found",
            "description": "<p>The <code>Book</code> was not found.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Author-not-found",
            "description": "<p>The <code>Author</code> was not found.</p>"
          }
        ]
      }
    },
    "filename": "./Books.js",
    "groupTitle": "Books"
  },
  {
    "type": "GET",
    "url": "/api/book/byid/?book_id=Value",
    "title": "Find book by BookId",
    "version": "0.0.0",
    "name": "GetBook",
    "group": "Books",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "id",
            "description": "<p>Book ID.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "BookId",
            "description": "<p>Book-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Title",
            "description": "<p>Book-Title.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "AuthorId",
            "description": "<p>Author-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ISBN",
            "description": "<p>Book-ISBN.</p>"
          },
          {
            "group": "Success 200",
            "type": "DatePicker",
            "optional": false,
            "field": "Published",
            "description": "<p>Date when book was published.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Publisher",
            "description": "<p>The name of the book's publisher.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "Pages",
            "description": "<p>Number of book pages.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Description",
            "description": "<p>Small breifing about the book's contents.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Cover",
            "description": "<p>Link that holds the book's cover picture.</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "Store",
            "description": "<p>Links for webpages that store the book.</p>"
          },
          {
            "group": "Success 200",
            "type": "Select",
            "optional": false,
            "field": "ReadStatus",
            "description": "<p>Read, Currently Reading, or Want to Read.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "BookRating",
            "description": "<p>Rating for the book.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n  \"BookId\":\"5c911452bbfd1717b8a7a169\",\n  \"Title\":\"sit\",\n  \"AuthorId\":\"5c911452a48b42bb84bc785c\",\n  \"ISBN\":\"5c911452ce18b2b3276d4b45\",\n  \"Published\":\"2001-05-08 \",\n  \"Publisher\":\"COREPAN\",\n  \"Pages\":226.0,\n  \"Description\":\"Ad officia duis enim occaecat ullamco aliqua sint mollit non ea et ea aliqua ea. Reprehenderit eu ut in elit ex eu. Excepteur Lorem est ad amet sunt.\\r\\n\",\n  \"Cover\":\"http://placehold.it/32x32\",\n  \"Store\":[\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\"],\n  \"ReadStatus\":\"Read\",\n  \"BookRating\":5.0,\n  \"Genre\":\"Horror\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Book-not-found",
            "description": "<p>The <code>Book</code> was not found.</p>"
          }
        ]
      }
    },
    "filename": "./Books.js",
    "groupTitle": "Books"
  },
  {
    "type": "GET",
    "url": "/book/genre",
    "title": "Find all books with the same Genre",
    "version": "0.0.0",
    "name": "GetBooksByGerne",
    "group": "Books",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "Genre",
            "description": "<p>the specfic Genre name</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "BookId",
            "description": "<p>Book-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Title",
            "description": "<p>Book-Title.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "AuthorId",
            "description": "<p>Author-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ISBN",
            "description": "<p>Book-ISBN.</p>"
          },
          {
            "group": "Success 200",
            "type": "DatePicker",
            "optional": false,
            "field": "Published",
            "description": "<p>Date when book was published.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Publisher",
            "description": "<p>The name of the book's publisher.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "Pages",
            "description": "<p>Number of book pages.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Description",
            "description": "<p>Small breifing about the book's contents.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Cover",
            "description": "<p>Link that holds the book's cover picture.</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "Store",
            "description": "<p>Links for webpages that store the book.</p>"
          },
          {
            "group": "Success 200",
            "type": "Select",
            "optional": false,
            "field": "ReadStatus",
            "description": "<p>Read, Currently Reading, or Want to Read.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "BookRating",
            "description": "<p>Rating for the book.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "    HTTP/1.1 200 OK\n    {\n      \"BookId\":\"5c911452bbfd1717b8a7a169\",\n      \"Title\":\"sit\",\n      \"AuthorId\":\"5c911452a48b42bb84bc785c\",\n      \"ISBN\":\"5c911452ce18b2b3276d4b45\",\n      \"Published\":\"2001-05-08 \",\n      \"Publisher\":\"COREPAN\",\n      \"Pages\":226.0,\n      \"Description\":\"Ad officia duis enim occaecat ullamco aliqua sint mollit non ea et ea aliqua ea. Reprehenderit eu ut in elit ex eu. Excepteur Lorem est ad amet sunt.\\r\\n\",\n      \"Cover\":\"http://placehold.it/32x32\",\n      \"Store\":[\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\"],\n      \"ReadStatus\":\"Read\",\n      \"BookRating\":5.0,\n      \"Genre\":\"Horror\"\n    },\n     {\n      \"BookId\":\"5c9114ddlfd2bbfd1717b8a7a169\",\n      \"Title\":\"ssdst\",\n      \"AuthorId\":\"5c911452a48b42bb84bc785c\",\n      \"ISBN\":\"5c911452ce18b2b3276d4b45\",\n      \"Published\":\"2001-05-08 \",\n      \"Publisher\":\"COREPAN\",\n      \"Pages\":226.0,\n      \"Description\":\"Ad officia duis enim occaecat ullamco aliqua sint mollit non ea et ea aliqua ea. Reprehenderit eu ut in elit ex eu. Excepteur Lorem est ad amet sunt.\\r\\n\",\n      \"Cover\":\"http://placehold.it/32x32\",\n      \"Store\":[\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\",\"http://placehold.it/32x32\"],\n      \"ReadStatus\":\"Read\",\n      \"BookRating\":5.0,\n      \"Genre\":\"Horror\"\n    },\n{\n................\n.............\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "genre-not-found",
            "description": "<p>The <code>genre</code> was not found.</p>"
          }
        ]
      }
    },
    "filename": "./Books.js",
    "groupTitle": "Books"
  },
  {
    "type": "GET",
    "url": "/api/book/reviewbyid/?book_id=Value",
    "title": "Get book reviews by id",
    "name": "GetReviewsbyBookId",
    "group": "Books",
    "version": "0.0.0",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "id",
            "description": "<p>Book ID.</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": true,
            "field": "rating",
            "defaultValue": "0",
            "description": "<p>Limit reviews to a particular rating or above,(default is 0).</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "UserId",
            "description": "<p>User-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "BookId",
            "description": "<p>Book-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "ReviewId",
            "description": "<p>Review-ID.</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "ReviewBody",
            "description": "<p>The text for the review entered by user.</p>"
          },
          {
            "group": "Success 200",
            "type": "DatePicker",
            "optional": false,
            "field": "ReviewDate",
            "description": "<p>Date where review was entered by user.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "ReviewRating",
            "description": "<p>Rating for the review.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n     \"ReviewId\":\"5c9243a5beb4101160e23fdd\",\n     \"BookId\":\"5c9114a012d11bb226399497\",\n     \"UserId\":\"5c9132dd47cb909f7fbbe875\",\n     \"ReviewRating\":5.0,\n     \"ReviewBody\":\"Mollit tempor consequat magna officia occaecat laborum duis consequat qui sunt ipsum. Commodo cillum voluptate incididunt mollit non non voluptate cillum id magna qui laborum ullamco adipisicing. Dolore consequat fugiat ut Lorem incididunt ea dolore voluptate aliquip. Reprehenderit duis est do ad consequat ad enim pariatur ad Lorem Lorem enim officia exercitation. Magna ea ipsum laborum sint est.\\r\\n\",\n     \"ReviewDate\":\" 2015-12-03T02:44:27 -02:00\"\n     \n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Book-Not-Found",
            "description": "<p>The <code>Book</code> was not found</p>"
          }
        ]
      }
    },
    "filename": "./Books.js",
    "groupTitle": "Books"
  },
  {
    "type": "get",
    "url": "/api/Book/byisbn/?book_isbn=Value",
    "title": "Get Geeksreads book IDs given ISBNs",
    "name": "IsbntoId",
    "group": "Books",
    "version": "0.0.0",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string[]",
            "optional": false,
            "field": "isbns",
            "description": "<p>Book-ISBNs.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string[]",
            "optional": false,
            "field": "ids",
            "description": "<p>Book-IDs.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n  \"BookIds\": [5c911452bbfd1717b8a7a169,5c9114526f1439874b7cca1a]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Books-Not-Found",
            "description": "<p>Some or all of the ISBNs entered are not valid.</p>"
          }
        ]
      }
    },
    "filename": "./Books.js",
    "groupTitle": "Books"
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./doc/main.js",
    "group": "C__Users_waela_Documents_GitHub_Geeksreads_Frontend_Backend_API_with_Documentation_doc_main_js",
    "groupTitle": "C__Users_waela_Documents_GitHub_Geeksreads_Frontend_Backend_API_with_Documentation_doc_main_js",
    "name": ""
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "AddedCommentSuc",
            "description": "<p>comment was added successfully</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{\n\"AddedCommentSuc\": true\n}",
          "type": "json"
        }
      ]
    },
    "type": "POST",
    "url": "/comment/create",
    "title": "Create a comment",
    "name": "creatComment",
    "group": "Comments",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Body",
            "description": "<p>The body of the comment</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>Subject Type Commented On; book,review,etc</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "BookId",
            "description": "<p>id of book commented on</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "ReviewId",
            "description": "<p>id review commented on</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "CommentId",
            "description": "<p>id of comment</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userName",
            "description": "<p>Name of user who wrote the comment</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "userID",
            "description": "<p>Id of user who wrote the comment</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Photo",
            "description": "<p>User Photo</p>"
          },
          {
            "group": "Parameter",
            "type": "datePicker",
            "optional": false,
            "field": "date",
            "description": "<p>the date the comment was written on</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "LikesCount",
            "description": "<p>number of likes on this comment</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "EmptyComment",
            "description": "<p>Must Have At Least <code>1</code> Character In Comment</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./commentsController.js",
    "groupTitle": "Comments"
  },
  {
    "type": "GET",
    "url": "/comment/list",
    "title": "List comments on a subject",
    "name": "listCommentsOnSubject",
    "group": "Comments",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "NOTFOUND",
            "description": "<p>no comments on this subject</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "likes",
            "description": "<p>number of likes on each comment</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "body",
            "description": "<p>body text of each comment</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "userName",
            "description": "<p>name of the user who wrote each comment</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "userId",
            "description": "<p>the id of the user who wrote each comment</p>"
          },
          {
            "group": "Success 200",
            "type": "datePicker",
            "optional": false,
            "field": "date",
            "description": "<p>the date of each comment</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{\n\"comment\":[\n        {\"likes\": 11,\n          \"body\": \"Hello World !\",\n          \"userName\": \"zzzdwsdsdsdsd zzzdwsdsdsdsd\",\n          \"userId\": \"567890987654567890\",\n          \"Photo\": \"url\",\n          \"date\": \"2019-01-02T09:00:16.204Z\"\n        },......\n]\n}",
          "type": "json"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "ReviewId",
            "description": "<p>Id of review given as type Parameter</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./commentsController.js",
    "groupTitle": "Comments"
  },
  {
    "type": "PUT",
    "url": "/like",
    "title": "Like a resource",
    "name": "PutLike",
    "group": "Resources",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "NOTFOUND",
            "description": "<p>Resource could not be found</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "resourceId",
            "description": "<p>Id of the resource being liked.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n     {\n         Liked\n     }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Resources.js",
    "groupTitle": "Resources"
  },
  {
    "type": "PUT",
    "url": "/unlike",
    "title": "Unlike a resource",
    "name": "PutUnlike",
    "group": "Resources",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "NOTFOUND",
            "description": "<p>Resource could not be found</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "resourceId",
            "description": "<p>Id of the resource being liked.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n     {\n         Unliked\n     }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Resources.js",
    "groupTitle": "Resources"
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "AddedReviewSuc",
            "description": "<p>Review was added successfully</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{\n\"AddedCommentSuc\": true\n}",
          "type": "json"
        }
      ]
    },
    "type": "POST",
    "url": "/review/add",
    "title": "Add review",
    "name": "AddReview",
    "group": "Review",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "reviewBody",
            "description": "<p>The body of the review</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "bookId",
            "description": "<p>id of book reviewd on</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "reviewId",
            "description": "<p>id review</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userName",
            "description": "<p>Name of user who wrote the review</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "userID",
            "description": "<p>Id of user who wrote the review</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "photo",
            "description": "<p>User Photo</p>"
          },
          {
            "group": "Parameter",
            "type": "datePicker",
            "optional": false,
            "field": "reviewDate",
            "description": "<p>the date the review was written on</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "likesCount",
            "description": "<p>number of likes on this review</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "rating",
            "description": "<p>number rating on review</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "shelf",
            "description": "<p>shelf name in which review is in</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "EmptyComment",
            "description": "<p>Must Have At Least <code>1</code> Character In Comment</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./reviewsController.js",
    "groupTitle": "Review"
  },
  {
    "type": "DELETE",
    "url": "/review/remove",
    "title": "Delete review",
    "name": "deletereview",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "reviewId",
            "description": "<p>id review</p>"
          },
          {
            "group": "Parameter",
            "type": "ObjectId",
            "optional": false,
            "field": "review_Id",
            "description": "<p>Id of the review to be deleted</p>"
          }
        ]
      }
    },
    "group": "Review",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "NOTFOUND",
            "description": "<p>the review you are looking for does not exist</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "deleteReviewSuc",
            "description": "<p>review was deleted</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{\n\"deleteReviewSuc\": true\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./reviewsController.js",
    "groupTitle": "Review"
  },
  {
    "type": "GET",
    "url": "/shelf/GetUserReadStatus",
    "title": "Gets information about a book's read Status",
    "name": "GetUserReadStatus",
    "group": "Shelves",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authentication token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "BookId",
            "description": "<p>The Book Id To Get Status for.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ReturnMsg",
            "description": "<p>Book Status.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n  \"ReturnMsg\":\"Read\"\n}",
          "type": "json"
        },
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n  \"ReturnMsg\":\"Currently Reading\"\n}",
          "type": "json"
        },
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n  \"ReturnMsg\":\"Want to Read\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "NoBook-Response:",
          "content": "    HTTP/1.1 400\n{\n  \"ReturnMsg\": \"Invalid Book Id\"\n}",
          "type": "json"
        },
        {
          "title": "Invalidtoken-Response:",
          "content": "  HTTP/1.1 400\n{\n   \"ReturnMsg\":'Invalid token.'\n}",
          "type": "json"
        },
        {
          "title": "NoTokenSent-Response:",
          "content": "    HTTP/1.1 401\n{\n  \"ReturnMsg\":'Access denied. No token provided.'\n}",
          "type": "json"
        },
        {
          "title": "NoTokenMatch-Response:",
          "content": "  HTTP/1.1 400\n{\n \"ReturnMsg\":\"User Doesn't Exist\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Users.js",
    "groupTitle": "Shelves"
  },
  {
    "type": "GET",
    "url": "/shelf/GetUserShelves",
    "title": "Gets All User's Shelves",
    "name": "GetUserShelves",
    "group": "Shelves",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authentication token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "ReadUserShelf",
            "description": "<p>Gives the User the Book Ids of His Read.</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "WantToReadUserShelf",
            "description": "<p>Gives the User the Book Ids of His Want to Read.</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "ReadingUserShelf",
            "description": "<p>Gives the User the Book Ids of His Currently Reading.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n{\n  \"Read\": [\n                     \"Book1\",\n                     \"Book2\",\n                     \"Book3\"\n                ],\n  \"WantToRead\": [\n                     \"Book4\",\n                     \"Book5\",\n                     \"Book6\"\n                ],\n  \"Reading\": [\n                     \"Book7\",\n                     \"Book8\",\n                     \"Book9\"\n                ]\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "NoShelvesExist-Response:",
          "content": "    HTTP/1.1 400\n{\n  \"ReturnMsg\": \"User has No Shelves\"\n}",
          "type": "json"
        },
        {
          "title": "Invalidtoken-Response:",
          "content": "  HTTP/1.1 400\n{\n   \"ReturnMsg\":'Invalid token.'\n}",
          "type": "json"
        },
        {
          "title": "NoTokenSent-Response:",
          "content": "    HTTP/1.1 401\n{\n  \"ReturnMsg\":'Access denied. No token provided.'\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Users.js",
    "groupTitle": "Shelves"
  },
  {
    "type": "Post",
    "url": "/user_status/delete",
    "title": "Delete User Status",
    "version": "0.0.0",
    "name": "DeleteStatus",
    "group": "Status",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "StatusId",
            "description": "<p>Status id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "boolen",
            "optional": false,
            "field": "DeleteStatusSuc",
            "description": "<p>if the delete happend successfully or not</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Expected Data on Success",
          "content": "{\n\"DeleteSTatusSuc\": true\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Status-Not-Found",
            "description": "<p>The <code>StatusID</code> was not found</p>"
          }
        ]
      }
    },
    "filename": "./Statuses.js",
    "groupTitle": "Status"
  },
  {
    "type": "Get",
    "url": "/user_status/show",
    "title": "Get User Status",
    "version": "0.0.0",
    "name": "GetUserStatuses",
    "group": "Status",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authentication token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "StatusId",
            "description": "<p>status id</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "UserId",
            "description": "<p>User id the user who is to see the status</p>"
          },
          {
            "group": "Success 200",
            "type": "datePicker",
            "optional": false,
            "field": "StatusDate",
            "description": "<p>the date when the status was written</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "CommentId",
            "description": "<p>comment id if the type is comment <code>(optional)</code></p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "ReviewId",
            "description": "<p>review Id  alawys exisit weather the type is comment or review</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "MakerId",
            "description": "<p>the id of the user who made the status</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "Type",
            "description": "<p>Whether  it is Comment or Review</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Expected Data on Success",
          "content": "{\n\ntype : Review\nStatusId : \"82978363763\"\nMakerId : \"shjfhghdsg\"\nUserId : \"82sdfd8363763\"\nReviewId : \"82gf8363763\"\n\n},\n{\n\ntype : Comment\nCommentId : \"hisadsfjhdld\"\nStatusId : \"82978363763\"\nMakerId : \"shjfhghdsg\"\nUserId : \"82sdfd8363763\"\nReviewId : \"82gf8363763\"\n.......\n},.....",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "NotFound statuses:",
          "content": "   HTTP/1.1 400\n{\n  \"ReturnMsg\":\"No statuses were found\"\n}",
          "type": "json"
        },
        {
          "title": "Invalidtoken-Response:",
          "content": "  HTTP/1.1 400\n{\n   \"ReturnMsg\":'Invalid token.'\n}",
          "type": "json"
        },
        {
          "title": "NoTokenSent-Response:",
          "content": "    HTTP/1.1 401\n{\n  \"ReturnMsg\":'Access denied. No token provided.'\n}",
          "type": "json"
        }
      ],
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "User-Not-Found",
            "description": "<p>The <code>User</code> was not found</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Status-Not-Found",
            "description": "<p>The <code>Status</code> was not found</p>"
          }
        ]
      }
    },
    "filename": "./Statuses.js",
    "groupTitle": "Status"
  },
  {
    "type": "Post",
    "url": "/user_status/",
    "title": "Update user status",
    "version": "0.0.0",
    "name": "UpdateUserStatuses",
    "group": "Status",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "StatusID",
            "description": "<p>status id</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "UserID",
            "description": "<p>User id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "StatusBody",
            "description": "<p>the body of this status</p>"
          },
          {
            "group": "Parameter",
            "type": "datePicker",
            "optional": false,
            "field": "StatusDate",
            "description": "<p>the date when the status was written</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "CommentId",
            "description": "<p>comment id <code>(optional)</code></p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "ReviewId",
            "description": "<p><code>(optional)</code></p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "boolen",
            "optional": false,
            "field": "UpdateSucc",
            "description": "<p>if the update happend successfully or not</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Expected Data on Success",
          "content": "{\n \"UpdateSucc\": true\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "User-Not-Found",
            "description": "<p>The <code>User</code> was not found</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "Status-Not-Found",
            "description": "<p>The <code>Status</code> was not found</p>"
          }
        ]
      }
    },
    "filename": "./Statuses.js",
    "groupTitle": "Status"
  },
  {
    "type": "GET",
    "url": "api/users/verify/:token",
    "title": "Verifies User From Email",
    "name": "EmailVerify",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authentication token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ReturnMsg",
            "description": "<p>Notifies that User is Confirmed</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "  HTTP/1.1 200 OK\n{\n  \"ReturnMsg\": \"User Confirmed\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "NoTokenMatch-Response:",
          "content": "  HTTP/1.1 400\n{\n \"ReturnMsg\":\"User Doesn't Exist\"\n}",
          "type": "json"
        },
        {
          "title": "Invalidtoken-Response:",
          "content": "  HTTP/1.1 400\n{\n   \"ReturnMsg\":'Invalid token.'\n}",
          "type": "json"
        },
        {
          "title": "NoTokenSent-Response:",
          "content": "    HTTP/1.1 401\n{\n  \"ReturnMsg\":'Access denied. No token provided.'\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Users.js",
    "groupTitle": "User"
  },
  {
    "type": "POST",
    "url": "/api/Users/Follow",
    "title": "Follow a user",
    "name": "Follow_user",
    "group": "User",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "id-not-found",
            "description": "<p>The<code>userId_tobefollowed</code> was not found.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 404 Not Found",
          "content": "HTTP/1.1 404 Not Found\n{\n\"success\": false,\n\"Message\":\"User Id not  found !\"\n}",
          "type": "JSON"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "200",
            "optional": false,
            "field": "Follow",
            "description": "<p>Successful or not</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n   {\n      \"success\": true,\n      \"Message\":\"Successfully done\"\n   }",
          "type": "JSON"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "myuserId",
            "description": "<p>GoodReads User ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId_tobefollowed",
            "description": "<p>GoodReads User ID</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./Users.js",
    "groupTitle": "User"
  },
  {
    "type": "GET",
    "url": "/user/me",
    "title": "Gets Information of Current User",
    "name": "GetUser",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-auth-token",
            "description": "<p>Authentication token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "UserName",
            "description": "<p>UserName of Current User</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "UserId",
            "description": "<p>Id of Current User</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "UserEmail",
            "description": "<p>Email of Current User</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "FollowingAuthorId",
            "description": "<p>Ids of Authors Current User is Following</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "FollowingUserId",
            "description": "<p>Ids of Users Current User is Following</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "FollowersUserId",
            "description": "<p>Ids of Users Following Current User</p>"
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "OwnedBookId",
            "description": "<p>Ids of Books Owned by Current User</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "    HTTP/1.1 200 OK\n  {\n    \"FollowingAuthorId\": [],\n    \"FollowingUserId\": [],\n    \"FollowersUserId\": [],\n    \"OwnedBookId\": [],\n    \"ShelfId\": [],\n    \"Confirmed\": true,\n    \"UserName\": \"Ahmed1913\",\n    \"UserEmail\": \"AhmedAmrKhaled@gmail.com\",\n    \"UserId\": \"5ca23e81783e981f88e1618c\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "NoTokenMatch-Response:",
          "content": "  HTTP/1.1 400\n{\n \"ReturnMsg\":\"User Doesn't Exist\"\n}",
          "type": "json"
        },
        {
          "title": "UnConfirmedUser-Response:",
          "content": "   HTTP/1.1 401\n{\n   \"ReturnMsg\" :'Your account has not been verified.'\n}",
          "type": "json"
        },
        {
          "title": "Invalidtoken-Response:",
          "content": "  HTTP/1.1 400\n{\n   \"ReturnMsg\":'Invalid token.'\n}",
          "type": "json"
        },
        {
          "title": "NoTokenSent-Response:",
          "content": "    HTTP/1.1 401\n{\n  \"ReturnMsg\":'Access denied. No token provided.'\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Users.js",
    "groupTitle": "User"
  },
  {
    "type": "POST",
    "url": "api/auth/signin/",
    "title": "Signing in by Email and Password",
    "name": "SignIn",
    "group": "User",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "UserEmail",
            "description": "<p>Email of User</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "UserPassword",
            "description": "<p>Password of User</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ReturnMsg",
            "description": "<p>Return Message Log in Successful.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "UserId",
            "description": "<p>Id of User after Successfully Signing in</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "Token",
            "description": "<p>Authentication Access Token</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "    HTTP/1.1 200 OK\n{\n       \"ReturnMsg\": \"Log in Successful.\",\n       \"UserId\": \"5ca23e81783e981f88e1618c\",\n       \"Token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1Y2EyM2U4MTc4M2U5ODFmODhlMTYxOGMiLCJpYXQiOjE1NTQxMzcxMjJ9.rUfROgeq1wgmsUxljg_ZLI2UbFMQubHQEYLKz2zd29Q\"\n  }",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "InvalidEmailorPassword-Response:",
          "content": "   HTTP/1.1 400\n{\n  \"ReturnMsg\":\"Invalid email or password.\"\n}",
          "type": "json"
        },
        {
          "title": "UnConfirmedUser-Response:",
          "content": "   HTTP/1.1 401\n{\n  \"ReturnMsg\" :'Your account has not been verified.'\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Auth.js",
    "groupTitle": "User"
  },
  {
    "type": "POST",
    "url": "api/users/signup/",
    "title": "Signs User Up and Sends Verification Email",
    "name": "SignUp",
    "group": "User",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "UserName",
            "description": "<p>User Name to Sign Up.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "UserEmail",
            "description": "<p>User Email to Sign Up.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "UserPassword",
            "description": "<p>User Password to Sign Up.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "ReturnMsg",
            "description": "<p>Notifies that User a verification Email is sent</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "  HTTP/1.1 200 OK\n{\n  \"ReturnMsg\":\"A verification email has been sent to UserEmail.\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "InvalidName-Response:",
          "content": "  HTTP/1.1 400\n{\n \"ReturnMsg\": \"\\\"UserName\\\" length must be at least 3 characters long\"\n}",
          "type": "json"
        },
        {
          "title": "InvalidEmail-Response:",
          "content": "  HTTP/1.1 400\n{\n   \"ReturnMsg\": \"\\\"UserEmail\\\" must be a valid email\"\n}",
          "type": "json"
        },
        {
          "title": "InvalidPassword-Response:",
          "content": "    HTTP/1.1 400\n{\n  \"ReturnMsg\": \"\\\"UserPassword\\\" length must be at least 6 characters long\"\n}",
          "type": "json"
        },
        {
          "title": "ExistingEmail-Response:",
          "content": "    HTTP/1.1 400\n{\n  \"ReturnMsg\":\"User already registered.\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./Users.js",
    "groupTitle": "User"
  },
  {
    "type": "POST",
    "url": "/api/Users/unFollow",
    "title": "Unfollow a user",
    "name": "Unfollow_user",
    "group": "User",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "404",
            "optional": false,
            "field": "id-not-found",
            "description": "<p>The<code>userId_tobefollowed</code> was not found.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 404 Not Found",
          "content": " HTTP/1.1 404 Not Found\n{\n\"success\": false,\n\"Message\":\"User Id not  found !\"\n}",
          "type": "JSON"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "200",
            "optional": false,
            "field": "UNFollow",
            "description": "<p>Successful</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n   {\n      \"success\": true,\n      \"Message\":\"Successfully done\"\n   }",
          "type": "JSON"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "myuserId",
            "description": "<p>GoodReads User ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userId_tobefollowed",
            "description": "<p>GoodReads User ID</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "./Users.js",
    "groupTitle": "User"
  }
] });
