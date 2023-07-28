const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({data: orders})
}

function bodyHasProperty(propertyName) {
  return function(req, res, next) {
    const {data = {}} = req.body;
    if(data[propertyName]) {
      return next();
    }
    console.log("this is a test", propertyName);
    next({
      status: 400, 
      message: `Order must include a ${propertyName}`});
  };
}

function dishIsValid(req, res, next) {
  const {data: {dishes} = {}} = req.body;
  if(!Array.isArray(dishes) || dishes.length <= 0) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  next();
}

function dishQuantityIsValid(req, res, next) {
  const {data: {dishes} = {}} = req.body;
  
  for(let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const {quantity} = dish;
    
    if(quantity === undefined || quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
    return next({
      status: 400,
      message: `Dish ${i} must have a quantity that is an integer greater than 0`,
    });
  }
  }
  next();
}

function create(req, res) {
  const {data: {deliverTo, mobileNumber, dishes} ={}} = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({data: newOrder});
}

function orderExists(req, res, next) {
  const {orderId} = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if(foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function read(req, res) {
  const orderId = req.params.orderId;
  const matchingOrder = orders.find((order) => order.id === orderId);
  res.json({data: res.locals.order});
}

function update(req, res) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  const {data: {deliverTo, mobileNumber, status, dishes} = {}}= req.body;
  
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;
  
  res.json({data: foundOrder});
}

function orderIdMatchesDataId(req, res, next) {
  const {data: {id} = {}} = req.body;
  const orderId = req.params.orderId;
  
  if(id !== "" && id !== orderId && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
    });
  }
  return next();
}

function statusPropertyValid(req, res, next) {
  const {data: {status} = {}} = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if(validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function statusPending(req, res, next) {
  const orderStatus = res.locals.order.status;
  //const {data: {status} = {}} = req.body;
  if(orderStatus !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
    });
  }
  return next();
}

function destroy(req, res) {
  const {orderId} = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyHasProperty("deliverTo"),
    bodyHasProperty("mobileNumber"),
    bodyHasProperty("dishes"),
    dishIsValid,
    dishQuantityIsValid,
    create
  ],
  list,
  update: [
    orderExists,
    orderIdMatchesDataId,
    bodyHasProperty("deliverTo"),
    bodyHasProperty("mobileNumber"),
    bodyHasProperty("dishes"),
    dishIsValid,
    dishQuantityIsValid,
    statusPropertyValid,
    update
  ],
  read: [orderExists, read],
  delete: [orderExists, statusPending, destroy],
}