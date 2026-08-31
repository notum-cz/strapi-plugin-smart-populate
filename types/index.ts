type SmartPopulateToken = 'smart';

type SmartPopulateObject<TPopulate extends object> = {
  [TKey in keyof TPopulate]?: SmartPopulateValue<TPopulate[TKey]>;
};

// Strapi adds `count` to nested populate params that target content types,
// including media and relations.
type SmartPopulateValue<TValue> =
  Extract<TValue, { count?: boolean }> extends never
    ?
        | SmartPopulateToken
        | (TValue extends { populate?: infer TNestedPopulate }
            ? Omit<TValue, 'populate'> & {
                populate?: SmartPopulate<TNestedPopulate>;
              }
            : TValue extends readonly (infer TItem)[]
              ? readonly SmartPopulateValue<TItem>[]
              : TValue extends object
                ? SmartPopulate<TValue>
                : TValue)
    : TValue;

type SmartPopulate<TPopulate> =
  | TPopulate
  | (TPopulate extends readonly (infer TItem)[]
      ? readonly SmartPopulateValue<TItem>[]
      : TPopulate extends object
        ? SmartPopulateObject<TPopulate>
        : never);

type PopulateOverrideEntry<TComponentUID extends string = string, TOverridePopulate = unknown> = {
  componentUid: TComponentUID;
  mergeWithGeneratedPopulate?: boolean;
  overridePopulate: TOverridePopulate;
};

type PopulateOverrideEntryForMap<TComponentPopulateMap extends object> = {
  [TComponentUID in keyof TComponentPopulateMap & string]: PopulateOverrideEntry<
    TComponentUID,
    TComponentPopulateMap[TComponentUID]
  >;
}[keyof TComponentPopulateMap & string];

type ResolveSmartPopulate<TValue> = TValue extends SmartPopulateToken
  ? true
  : TValue extends readonly (infer TItem)[]
    ? ResolveSmartPopulate<TItem>[]
    : TValue extends object
      ? { [TKey in keyof TValue]: ResolveSmartPopulate<TValue[TKey]> }
      : TValue;

type ResolveSmartPopulateParams<TParams extends { populate?: unknown }> = [TParams] extends [never]
  ? never
  : Omit<TParams, 'populate'> & {
      populate?: ResolveSmartPopulate<TParams['populate']>;
    };

type PopulateKeys<TValue> = TValue extends readonly (infer TItem)[]
  ? PopulateKeys<TItem>
  : TValue extends `${infer THead},${infer TTail}`
    ? PopulateKeys<THead> | PopulateKeys<TTail>
    : TValue extends `${infer THead}.${string}`
      ? THead
      : TValue extends object
        ? keyof TValue
        : TValue;

type IsUnknown<TValue> = unknown extends TValue
  ? [TValue] extends [unknown]
    ? true
    : false
  : false;

type PopulatedKeys<TPopulate, TFallbackKeys extends PropertyKey> =
  IsUnknown<TPopulate> extends true
    ? TFallbackKeys
    : [Extract<PopulateKeys<TPopulate>, TFallbackKeys>] extends [never]
      ? TFallbackKeys
      : Extract<PopulateKeys<TPopulate>, TFallbackKeys>;

type Extend<TBase, TExtension> = Omit<TBase, keyof TExtension> & TExtension;

export type WithSmartPopulateResultParams<
  TParams extends { populate?: unknown },
  TNativeParams extends { populate?: unknown },
> =
  ResolveSmartPopulateParams<TParams> extends infer TResolved extends TNativeParams
    ? TResolved
    : never;

export type PopulateOverrideEntries<TComponentPopulateMap extends object> =
  readonly PopulateOverrideEntryForMap<TComponentPopulateMap>[];

export type WithSmartPopulate<TParams extends { populate?: unknown }> = Omit<
  TParams,
  'populate'
> & {
  populate?: SmartPopulate<TParams['populate']>;
};

export type WithSmartPopulateResult<
  TResult,
  TParams extends { populate?: unknown },
  TContext extends {
    contentType: object;
    populatableKeys: keyof TContext['contentType'];
  },
> = Extend<
  TResult,
  Pick<TContext['contentType'], PopulatedKeys<TParams['populate'], TContext['populatableKeys']>>
>;
