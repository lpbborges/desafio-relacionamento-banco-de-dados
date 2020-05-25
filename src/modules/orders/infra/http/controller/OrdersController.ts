import { Request, Response } from 'express';

import { container } from 'tsyringe';

import CreateOrderService from '@modules/orders/services/CreateOrderService';
import FindOrderService from '@modules/orders/services/FindOrderService';

export default class OrdersController {
  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.body;

    const findOrder = container.resolve(FindOrderService);

    const order = await findOrder.execute({ id });

    return response.json(order);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const { customer_id, products } = request.body;

    const createOrder = container.resolve(CreateOrderService);

    const order = await createOrder.execute({
      customer_id,
      products,
    });

    return response.json({
      customer: {
        id: order.customer_id,
        name: order.customer.name,
        email: order.customer.email,
      },
      order_products: order.order_products.map(order_product => {
        return {
          product_id: order_product.product_id,
          price: order_product.price,
          quantity: order_product.quantity,
        };
      }),
    });
  }
}
