const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({data: dishes})
}

function bodyHasProperty(propertyName) {
  return function(req, res, next) {
    const {data = {}} = req.body;
    if(data[propertyName]) {
      res.locals.description = propertyName;
      return next();
    }
    next({
      status: 400, 
      message: `Dish must include a ${propertyName}`});
  };
}

function priceIsValidNumber(req, res, next) {
  const {data: {price} = {}} = req.body;
  if(price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`
    });
  }
  next();
}

function create(req, res) {
  const {data: {name, description, price, image_url} = {}} = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({data: newDish});
}

function dishExists(req, res, next) {
  const {dishId} = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if(foundDish) {
    res.locals.matchingDish = foundDish;
    return next();
  }
  next({
    status: 404, 
    message: `Dish id not found: ${dishId}`,
  });
}

function read(req, res) {
  const dishId = req.params.dishId;  
  const matchingDish = dishes.find((dish) => dish.id === dishId);  
  res.json({ data: res.locals.matchingDish })
}

function update(req, res) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId); 
  const {data: {name, description, price, image_url} = {}} = req.body;
  
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  
  res.json({data: foundDish});
}

function dishIdMatchesDataId(req, res, next) {
  const {data: {id} = {}} = req.body;
  const dishId = req.params.dishId;
  
  if(id !== "" && id !== dishId && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    });
  }
  return next();
}

module.exports = {
  create: [
    bodyHasProperty("name"),
    bodyHasProperty("description"),
    bodyHasProperty("price"),
    bodyHasProperty("image_url"),
    priceIsValidNumber,
    create
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    dishIdMatchesDataId,
    bodyHasProperty("name"),
    bodyHasProperty("description"),
    bodyHasProperty("price"),
    bodyHasProperty("image_url"),
    priceIsValidNumber,
    update
  ],
};
// TODO: Implement the /dishes handlers needed to make the tests pass

