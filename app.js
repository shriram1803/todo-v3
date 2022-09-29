//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const uri = "mongodb+srv://shriram_r__:<PASSWORD>@cluster0.e4gsd9p.mongodb.net/todoDB";

mongoose.connect(uri);

const itemsSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please specify a Name!!"]
  }
});
const listSchema = mongoose.Schema({
  name: String,
  listItems: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const start = new Item({name: 'Start your To-Do!'});
const instruct = new Item({name: 'Click the + button to add Items'});

const defaultItems = [start, instruct];

app.get("/", function(req, res) {
  Item.find({}, function(err, items){
    if(items.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });
});

app.get("/:listName", function(req,res){
  const listName = _.capitalize(req.params.listName);
  List.findOne({name: listName}, function(err, list){
    if(err){
      console.log(err);
    } else {
      if(!list){
        const list = new List({
          name: listName,
          listItems: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        //console.log(list.items);
        res.render("list", {listTitle: list.name, newListItems: list.listItems});
      }
    }
  });
});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({name: item});
  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, currentList){
      //console.log(currentList);
      currentList.listItems.push(newItem);
      currentList.save();
      res.redirect("/" + listName);
    });
  }  
});

app.post("/delete", function(req, res){
  const itemID = req.body.checkedItem;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(itemID, function(err){
      if(err){
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOne({name: listName}, function(err, currentList){
      currentList.listItems.pull({_id: itemID});
      currentList.save(function(){
        res.redirect("/" + listName);
      });
    });
  }  
});

app.get("/about", function(req, res){
  res.render("about");
});

const port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
