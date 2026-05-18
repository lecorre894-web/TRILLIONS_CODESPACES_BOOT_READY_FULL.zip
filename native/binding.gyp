{
  "targets": [
    {
      "target_name": "trillions_native",
      "sources": [ "src/trillions_native.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "cflags_cc": [
        "-O3",
        "-mavx2",
        "-mavx512f"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ]
    }
  ]
}
