import {handleAccount} from '../../server/account.mjs';
export const onRequest=context=>new URL(context.request.url).pathname==='/auth/return/'?context.next():handleAccount(context.request,context.env);
