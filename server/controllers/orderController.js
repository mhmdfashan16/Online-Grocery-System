

// place order COD: /api/order/cod

import { request, response } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from 'stripe';
import User from "../models/User.js";

// export const placeOrderCOD = async(req, res)=>{
//     try{
//         const {userId, items, address} = req.body;
//         if(!address|| items.length ===0){
//             return res.json({success:false, message:"Invalid Data"});
//         }
//         //Calculate amount using item
//         const amount = items.reduce(async(acc, item)=>{
//             const product = await Product.findById(item.product);
//             return (await acc)+product.offerPrice * item.quantity;
//         }, 0)

//         //Add Tax charge 2%

//         amount += Math.floor(amount * 0.02);

//         await Order.create({
//             userId,
//             items,
//             amount,
//             address,
//             paymentType:"COD",
//         });
//         return res.json({success:true, message:"order placed succeffully"})
//     }catch(error){
//         console.log(error.message);
//         res.json({success:false, message:error.message});

//     }
// }

export const placeOrderCOD = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" });
        }

        // Correct async accumulation of amount
        let amount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.json({ success: false, message: "Product not found" });
            }
            amount += product.offerPrice * item.quantity;
        }

        // Add 2% tax
        amount += Math.floor(amount * 0.02);

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        });

        return res.json({ success: true, message: "Order placed successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

//Place order Stripe /api/oder/stripe

export const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        const {origin} = req.headers;

        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid Data" });
        }

        // let productData = [];

        // // Correct async accumulation of amount
        // const amount = items.reduce(async(acc, item)=>{
        //                  const product = await Product.findById(item.product);
        //                  productData.push({
        //                     name:product.name,
        //                     price:product.offerPrice,
        //                     quantity:item.quantity
        //                  })
        //                  return (await acc) + product.offerPrice * item.quantity;
        //              }, 0)

        // // Add 2% tax
        // amount += Math.floor(amount * 0.02);
        let amount = 0;
        let productData = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity
            });

            amount += product.offerPrice * item.quantity;
        }

        // Add 2% tax
        amount += Math.floor(amount * 0.02);


        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "online",
        });

        //Stripe gateWay initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        //create line items stripe

        const lineItems = productData.map((item)=>{
            return{
                price_data:{
                    currency: "usd",
                    product_data:{
                        name:item.name,

                    },
                    unit_amount: Math.floor(item.price + item.price * 0.02) * 100
                },
                quantity:item.quantity,
            }
        })

        //create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items:lineItems,
            mode:"payment",
            success_url:`${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata:{
                orderId: order._id.toString(),
                userId,
            }        
        })

        return res.json({success:true, url: session.url});

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

//Stripe Webhooks to Verify Payment Action: /stripe
export const stripeWebHooks = async ()=>{
    //Stripe Gatway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const sig = req.headers["stripe-signature"];
    let event;

    try{
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    }catch(error){
        response.status(400).send(`Webhook error: ${error.message}`);
    }

    //Handle the event
    switch(event.type){
        case "payment_intent.succeeded":{
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //Getting Session Metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            })

            const { orderId, userId} = session.data[0].metadata;

            //Mark payment as paid
            await Order.findByIdAndUpdate(orderId, {isPaid:true})
            //Clear user cart
            await User.findByIdAndUpdate(userId, {

            })
        break;
        }
        case "payment_intent.payment_failed":{
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //Getting Session Metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            })

            const { orderId } = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
        default:
            console.error(`Unhandled Event type ${event.type}`);
            break;

    }
    res.json({received:true})
}


//Get Order by User Id  : /api/orders/user
export const getUserOrders = async(req, res)=>{
    try{
        const {userId} = req;
        if(!userId){
           return res.json({success:false, message:"User not auhtendicate"})
        }
        const orders = await Order.find({
            userId,
            $or:[{paymentType:"COD"},{isPaid:true}]
        })
        .populate("items.product")
        .populate("address")
        .sort({createdAt: -1});
        res.json({success:true, orders});
    }catch(error){
        res.json({success:false, message:error.message})
    }
}

//get All orders
export const getAllOrders = async(req, res)=>{
    try{       
        const orders = await Order.find({
          
            $or:[{paymentType:"COD"},{isPaid:true}]
        })
        .populate("items.product")
        .populate("address")
        .sort({createdAt: -1});
        res.json({success:true, orders});
    }catch(error){
        res.json({success:false, message:error.message})
    }
}