import { Adapter } from "../adapters/types";
import { POLYGON, AVAX } from "../helpers/chains";
import { request, gql } from "graphql-request";
import type { ChainEndpoints } from "../adapters/types"
import { Chain } from '@defillama/sdk/build/general';
import { getTimestampAtStartOfDayUTC } from "../utils/date";

const endpoints = {
  [POLYGON]: "https://api.thegraph.com/subgraphs/name/defi-techz/graphordertst",
}

let dailyFee= 0;
let finalDailyFee = 0;
let userFee = 0;
let finalUserFee = 0;

const methodology = {
  Fees: "Fees from open/close position, swap, mint and burn (based on tokens balance in the pool) and borrow fee ((assets borrowed)/(total assets in pool)*0.01%)",
  UserFees: "Fees from open/close position, swap and borrow fee ((assets borrowed)/(total assets in pool)*0.01%)",
  HoldersRevenue: "30% of all collected fees goes to COVO stakers",
  SupplySideRevenue: "70% of all collected fees goes to COVOLP holders",
  Revenue: "Revenue is 30% of all collected fees, which goes to COVO stakers",
  ProtocolRevenue: "Treasury has no revenue"
}

const graphs = (graphUrls: ChainEndpoints) => {
  return (chain: Chain) => {
    return async (timestamp: number) => {
      const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp)
      const searchTimestamp = todaysTimestamp 

      const graphQuery = gql
      `{
        feeStat(id: "${searchTimestamp}") {
          mint
          burn
          marginAndLiquidation
          swap
        }
      }`;
    
      const graphRes = await request(graphUrls[chain], graphQuery);

      if (graphRes.feeStat!=null){
       dailyFee = parseInt(graphRes.feeStat.mint) + parseInt(graphRes.feeStat.burn) + parseInt(graphRes.feeStat.marginAndLiquidation) + parseInt(graphRes.feeStat.swap)
       finalDailyFee = (dailyFee / 1e30);
       userFee = parseInt(graphRes.feeStat.marginAndLiquidation) + parseInt(graphRes.feeStat.swap)
       finalUserFee = (userFee / 1e30);

      }
      return {
        timestamp,
        dailyFees: finalDailyFee.toString(),
        dailyUserFees: finalUserFee.toString(),
        dailyRevenue: (finalDailyFee * 0.3).toString(),
        dailyProtocolRevenue: "0",
        totalProtocolRevenue: "0",
        dailyHoldersRevenue: (finalDailyFee * 0.3).toString(),
        dailySupplySideRevenue: (finalDailyFee * 0.7).toString(),
      };
    };
  };
};


const adapter: Adapter = {
  adapter: {
    [POLYGON]: {
      fetch: graphs(endpoints)(POLYGON),
      start: async () => 1672511400,
      meta: {
        methodology
      }
    },
  }
}

export default adapter;
