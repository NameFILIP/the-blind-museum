import debounce from "lodash.debounce";
import { useEffect, useCallback, useState, ChangeEvent } from "react";
import { OBJ_URL, SEARCH_URL } from "./consts";
import { Art } from "./models/Art";
import Image from "./Image";
import { Input } from "baseui/input";
import { ParagraphLarge } from "baseui/typography";

type TArtworkIds = {
  objectIDs: string[];
};
type TArtPiece = {
  objectID: string;
  primaryImageSmall: string;
};
type TArtPieces = TArtPiece[];

const MAX_WIDTH = 500;

const FETCH_QUANTITY = 5;

const EMPTRY_RESULT: string[] = [];

// Search for objectIDs
const searchObjectIDs = async (q: string) => {
  const res = await fetch(`${SEARCH_URL}?q=${q}&hasImages=true`);
  const response: TArtworkIds = await res.json();

  console.log({ response });

  return response.objectIDs ?? EMPTRY_RESULT;
};

// Fetch artworks data from the objectIDs
const fetchArtworks = async (objectIDs: string[]) => {
  const responses = await Promise.all(
    objectIDs.map(async (id) => {
      const res = await fetch(`${OBJ_URL}/${id}`);
      const artworks = await res.json();
      return artworks;
    })
  );
  console.log({ responses });

  const validObjs = responses.filter(
    (res) => res.objectID && res.primaryImageSmall
  );
  return validObjs.map((validObj) => new Art(validObj));
};

export const Search = ({ eyesClosed }: { eyesClosed: boolean }) => {
  const [query, setQuery] = useState("flowers");
  const [objectIDs, setObjectIDs] = useState<string[]>([]);
  const [artworks, setArtworks] = useState<TArtPieces | []>([]);
  const [artworkIndex, setArtworkIndex] = useState<number>(-1);

  const debouncedFetchObjectIDs = useCallback(
    debounce((q) => searchObjectIDs(q).then((res) => setObjectIDs(res)), 500),
    []
  );

  // Find new objectIDs when the search query changes
  useEffect(() => {
    if (query.length > 0) {
      debouncedFetchObjectIDs(query);
    }
  }, [query]);

  // Fetch artworks data when the objectIDs change
  useEffect(() => {
    // If the index is close to the end of the artworks, fetch more
    if (artworks.length - artworkIndex < FETCH_QUANTITY - 1) {
      const objectsToFetch = objectIDs.slice(
        artworks.length,
        artworks.length + FETCH_QUANTITY
      );
      fetchArtworks(objectsToFetch).then((res) => {
        setArtworks((artworks) => [...artworks, ...res]);
      });
    }
  }, [objectIDs, artworks.length, artworkIndex]);

  // Increment the artwork index each time the eyes open
  useEffect(() => {
    if (!eyesClosed) {
      setArtworkIndex((prev) => prev + 1);
    }
  }, [eyesClosed]);

  // Log the artworks when they change
  useEffect(() => {
    console.log({ artworks });
  }, [artworks]);

  const handleChangeQuery = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setQuery(e.target.value);

  const artwork = artworks[artworkIndex % artworks.length];

  return (
    <>
      <Input
        id="search"
        value={query}
        onChange={handleChangeQuery}
        placeholder="Search for an art piece"
        overrides={{
          Root: {
            style: {
              maxWidth: `${MAX_WIDTH}px`,
            },
          },
        }}
      />
      {!eyesClosed && (
        <ParagraphLarge>
          Please close your eyes to fully immerse yourself in the blind museum
          experience.
        </ParagraphLarge>
      )}
      <div style={{ visibility: eyesClosed ? "visible" : "hidden" }}>
        {artwork && <Image src={artwork.primaryImageSmall} />}
      </div>
    </>
  );
};
