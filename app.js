const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js")
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema ({
  title: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  title: "Welcome to your to do list"
});

const item2 = new Item ({
  title: "Hit the + button to add a new item."
});

const item3 = new Item ({
  title: "<-- Hit this to cross off and delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const day = date.getDate();
  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Added items to the DB");
        }
      });
      res.redirect("/");
    } else {
    res.render("list", {listTitle: day, itemList: items});
    }
  });  
});

app.post("/", function (req, res) {
  const day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    title: itemName
  });

  if(listName === day) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:customList", function(req, res){
  const customListName = _.capitalize(req.params.customList);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();

        res.redirect("/" + customListName)
      } else {
        res.render("list", {listTitle: foundList.name, itemList: foundList.items});
      }
    }
  });

});

app.post("/delete", function(req, res){
  const day = date.getDate();
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day){
    Item.deleteOne({_id: checkedItem}, function(err){
      if (!err){
        console.log("Removed");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate (
      {name: listName},
      {$pull: {items: {_id: checkedItem}}},
      function(err, foundList){
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }

});

app.get ("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
