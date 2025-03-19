# flt-lib

`flt-lib` is a JavaScript library for creating and manipulating filter byte arrays compatible with Developer Express's FLT format. It allows converting between a JSON-based filter object and the binary FLT format.


## Usage

The library provides functions for converting a JSON filter object to FLT files and vice versa. It supports various comparison operations and logical operations, defined in `constants.js`.

### Example JSON Filter

```json
{
  "operation": "OR",
  "conditions": [
    {
      "type": "condition",
      "value": "prefix%",
      "matchType": "LIKE",
      "row": 1
    },
    {
      "type": "group",
      "operation": "AND",
      "conditions": [
        {
          "type": "condition",
          "value": ["X", "Y"],
          "matchType": "IN_LIST",
          "row": 2
        },
        {
          "type": "condition",
          "value": "100",
          "matchType": "BIGGER_EQUALS",
          "row": 3
        }
      ]
    }
  ]
}
```


## Testing

To run the tests, execute the following command:

```bash
npm test
```

This will run the tests defined in `lib.test.js`.