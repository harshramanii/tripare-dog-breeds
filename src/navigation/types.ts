import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  BreedList: undefined;
  BreedDetails: { breedId: string; name: string };
};

export type BreedListProps = NativeStackScreenProps<
  RootStackParamList,
  "BreedList"
>;
export type BreedDetailsProps = NativeStackScreenProps<
  RootStackParamList,
  "BreedDetails"
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
