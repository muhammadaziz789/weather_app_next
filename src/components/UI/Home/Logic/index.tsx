"use client";
import weatherService from "@/services/Weather";
import { useSearchHistory } from "@/store/history";
import { useSearch } from "@/store/search";
import { useMemo } from "react";
import { UseQueryResult, useQuery } from "react-query";

export const FetchFunction = () => {
  const { search } = useSearch();
  const { history_list, setHistoryList } = useSearchHistory();

  const { data: weatherData, isLoading }: UseQueryResult<any, Error> = useQuery(
    ["GET_WEATHER_DATA", search],
    () => {
      return weatherService.getWeatherData({ q: search });
    },
    {
      enabled: !!search,
    }
  );

  const storeList = (obj: {}, weather: any) => {
    let newData = {
      name: weather.city.name,
      country: weather.city.country,
      weather: weather.list[0].weather[0].main,
      list: [obj],
    };

    let oldArr: any = [...history_list];

    if (oldArr?.length > 0) {
      const found: any = oldArr.find(
        (item: { name: string }) => item.name === newData.name
      );

      if (found?.name) {
        oldArr = oldArr.filter(
          (item: { name: string }) => item.name !== newData.name
        );
        oldArr.push(newData);
      } else {
        if (oldArr?.length < 5) {
          oldArr.push(newData);
        } else {
          oldArr.shift()
          oldArr.push(newData);
        }
      }
    } else {
      oldArr = [newData];
    }

    setHistoryList(oldArr);
  };

  const weather = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    if (!weatherData) return;

    weatherData?.list?.forEach((element: { dt_txt: string }) => {
      const date = element.dt_txt.substring(0, element.dt_txt.indexOf(" "));
      if (date in grouped) {
        grouped[date].push(element);
      } else {
        grouped[date] = [element];
      }
    });

    storeList(grouped, weatherData);
    return {
      ...weatherData,
      grouped,
    };
  }, [weatherData]);

  const lastData = useMemo(() => {
    if (weatherData?.grouped || search) return {};

    if (!history_list?.length) return {};
    const data: any = [...history_list];

    return {
      ...data[data.length - 1],
      grouped: data[data.length - 1].list[0] ?? [],
    };
  }, [history_list, weatherData, search]);

  return { weatherData: weather, isLoading, lastData };
};
