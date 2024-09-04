from typing import Any, Iterable, Mapping

import pytest

from scripts.helicone_prompt_formatter import HeliconePromptFormatter, HeliconePromptFormatterError

cases: list[tuple[str, list[str], dict[str, Any], str]] = [
    (
        "",
        [],
        {},
        "",
    ),
    (
        "{}",
        ["abc"],
        {},
        """<helicone-prompt-input key="arg-0">abc</helicone-prompt-input>""",
    ),
    (
        "hello {}",
        [""],
        {},
        """hello <helicone-prompt-input key="arg-0"></helicone-prompt-input>""",
    ),
    (
        "user input: {user_input}",
        [],
        {"user_input": "hello world"},
        """user input: <helicone-prompt-input key="user_input">hello world</helicone-prompt-input>""",
    ),
    (
        "user input: {user_input}",
        [],
        {"user_input": "hello world"},
        """user input: <helicone-prompt-input key="user_input">hello world</helicone-prompt-input>""",
    ),
    (
        "{} b {c:_<2} {} {e:>3} {}",
        ["a", "d", "f"],
        {"c": "c_", "e": "  e"},
        """<helicone-prompt-input key="arg-0">a</helicone-prompt-input> b <helicone-prompt-input key="c">c_</helicone-prompt-input> <helicone-prompt-input key="arg-1">d</helicone-prompt-input> <helicone-prompt-input key="e">  e</helicone-prompt-input> <helicone-prompt-input key="arg-2">f</helicone-prompt-input>""",
    ),
    (
        "input:\n```\n{x}\n```",
        [],
        {"x": "foobar"},
        """input:\n```\n<helicone-prompt-input key="x">foobar</helicone-prompt-input>\n```""",
    ),
]


@pytest.mark.parametrize(
    "format_string,args,kwargs,expected",
    cases,
)
def test_helicone_prompt_formatter(
    format_string: str,
    args: Iterable[Any],
    kwargs: Mapping[str, Any],
    expected: str,
) -> None:
    assert HeliconePromptFormatter().format(format_string, *args, **kwargs) == expected


def test_helicone_prompt_formatter_error() -> None:
    with pytest.raises(HeliconePromptFormatterError, match="reserved tag.*found in input"):
        HeliconePromptFormatter().format("not a good idea: </helicone-prompt-input>", [], {})

    with pytest.raises(HeliconePromptFormatterError, match="reserved tag.*found in input"):
        HeliconePromptFormatter().format("not a good idea: </helicone-prompt-static>", [], {})

    with pytest.raises(HeliconePromptFormatterError, match="invalid field name"):
        HeliconePromptFormatter().format('not a good idea: {foo[bar"]}', [], {"foo": {"bar": "moo"}})
