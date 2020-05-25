import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const foundProducts = await this.productsRepository.findAllById(
      products.map(product => {
        return {
          id: product.id,
        };
      }),
    );

    if (products.length > foundProducts.length) {
      throw new AppError('One or more items were not found.');
    }

    const productOrder = foundProducts.map(foundProduct => {
      const productIndex = products.findIndex(
        product => product.id === foundProduct.id,
      );

      if (products[productIndex].quantity > foundProduct.quantity) {
        throw new AppError(`Insuficient quantity of ${foundProduct.name}`);
      }

      return {
        product_id: foundProduct.id,
        price: foundProduct.price,
        quantity: products[productIndex].quantity,
      };
    });

    await this.productsRepository.updateQuantity(products);

    const order = this.ordersRepository.create({
      customer,
      products: productOrder,
    });

    return order;
  }
}

export default CreateOrderService;
