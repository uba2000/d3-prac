const data = [10, 20, 30, 40, 50];

const el = d3
  .select("ul") // change the parent selection
  .selectAll("li")
  .data(data); // when .data() is called, the UPDATE pattern begins

// Enter Selection

// enter contains what hasn't been joined to a selection (EnterNode-virtual elements that hold the data)
// group contains selections that have been joined

// el.join("li") // will look  at selection if the enter selection exist the add elements that hasnt been joined
// Exit election...
// and also removes excess elements from DOM
// when you pass in a function d3 will allow you do things youself and won't
// join the selection with data
el.join(
  (enter) => {
    return enter.append("li").style("color", "purple");
  },
  (update) => update.style("color", "green"),
  (exit) => exit.remove()
) // we can use the Enter, Update and Delete functions in join..
  .text((d) => d);

// Update pattern
// !Deprecated
// an alternative to join
// the following functions are only available after calling .data()
// el.enter()
//   .append("li")
//   .text((d) => d);

// el.exit().remove();
