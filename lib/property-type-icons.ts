import {
  Bike,
  Briefcase,
  Building,
  Building2,
  Car,
  DoorOpen,
  Home,
  KeyRound,
  Landmark,
  MapPin,
  Store,
  Tag,
  Trees,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon choices for a property type category — offered in the admin picker
 * (AdminPropertyTypesPage) and used to render the icon next to each type in
 * the "Browse Property Types" menu (TopBar). Categories store the chosen
 * `key` string in Firestore; `getPropertyTypeIcon` resolves it back to a
 * component and falls back to Building2 for anything unset or unrecognized
 * (e.g. an icon key from a version of this list that later changed).
 */
export const PROPERTY_TYPE_ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: "Building2", Icon: Building2 },
  { key: "Home", Icon: Home },
  { key: "DoorOpen", Icon: DoorOpen },
  { key: "Users", Icon: Users },
  { key: "Store", Icon: Store },
  { key: "Briefcase", Icon: Briefcase },
  { key: "Warehouse", Icon: Warehouse },
  { key: "Bike", Icon: Bike },
  { key: "Car", Icon: Car },
  { key: "Building", Icon: Building },
  { key: "Trees", Icon: Trees },
  { key: "KeyRound", Icon: KeyRound },
  { key: "Tag", Icon: Tag },
  { key: "Landmark", Icon: Landmark },
  { key: "MapPin", Icon: MapPin },
];

export const DEFAULT_PROPERTY_TYPE_ICON = "Building2";

const ICON_BY_KEY = new Map(PROPERTY_TYPE_ICON_OPTIONS.map((option) => [option.key, option.Icon]));

export function getPropertyTypeIcon(key: string | undefined | null): LucideIcon {
  return (key && ICON_BY_KEY.get(key)) || Building2;
}
