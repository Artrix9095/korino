import { gql } from "@apollo/client";

export const GET_CURRENT_USER = gql`
  query {
    Viewer {
      id
      name
      avatar {
        large
        medium
      }
      bannerImage
    }
  }
`;
