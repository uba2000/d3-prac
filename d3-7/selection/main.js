d3.select("p"); // select an element

// similar to

document.querySelector("p");

// Appending document

const el = d3.select("body").append("p");

// Transformation Methods
el.attr("class", "foo");

el.text("Hello World");

// Log el
console.log(el);
