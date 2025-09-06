package main

import (
	"embed"
	"github.com/ccheshirecat/flint/cmd"
)

//go:embed web/out/*
var assets embed.FS

func main() {
	cmd.ExecuteWithAssets(assets)
}
