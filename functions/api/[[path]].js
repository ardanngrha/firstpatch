import {handleAccount} from '../../server/account.mjs';
export const onRequest=context=>handleAccount(context.request,context.env);
