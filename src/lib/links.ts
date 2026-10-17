import { currentUser } from "@/data/users";

export const userHref = (id: string) => (id === currentUser.id ? "/profile" : `/user?id=${id}`);
export const groupHref = (id: string) => `/group?id=${id}`;
