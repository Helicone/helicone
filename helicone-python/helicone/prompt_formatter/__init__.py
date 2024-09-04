import logging
import re
import string
from typing import ClassVar, Iterable, Literal

log = logging.getLogger("helicone-prompt-formatter")


class HeliconePromptFormatterError(Exception):
    def __init__(
        self,
        message: str,
        token: tuple[str, str | None, str | None, str | None],
        format_string: str,
    ) -> None:
        super().__init__(f"{message}\n(Error received while reading {token})")
        self.message = message
        self.token = token
        self.format_string = format_string


class HeliconePromptFormatter(string.Formatter):
    HELICONE_PROMPT_INPUT_OPEN: ClassVar[str] = '<helicone-prompt-input key="{key_name}">'
    HELICONE_PROMPT_INPUT_CLOSE: ClassVar[str] = "</helicone-prompt-input>"
    HELICONE_PROMPT_STATIC_OPEN: ClassVar[str] = "<helicone-prompt-static>"
    HELICONE_PROMPT_STATIC_CLOSE: ClassVar[str] = "</helicone-prompt-static>"

    # reserved_tags may not appear in the format_string passed to this formatter!
    reserved_tags: ClassVar[list[str]] = [
        HELICONE_PROMPT_INPUT_CLOSE,
        HELICONE_PROMPT_STATIC_CLOSE,
    ]

    valid_field_name_regex: ClassVar[re.Pattern] = re.compile("^[a-zA-Z0-9_-]*$")

    def __init__(self, tag_spacer: str = "", *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.helicone_tag_spacer = tag_spacer

    def parse(self, format_string: str) -> Iterable[tuple[str, str | None, str | None, str | None]]:
        """When we find formats specified in the string we inject helicone-prompt-input tags that the helicone prompt parser expects."""
        log.debug(f"[PARSE]: {format_string}")
        unnamed_args_count: int = 0
        parser_state: Literal["init", "opened"] = "init"

        # parsing logic is based off my understanding of
        # [MarkupIterator_next](https://github.com/python/cpython/blob/9e079c220b7f64d78a1aa36a23b513d7f377a694/Objects/stringlib/unicode_format.h#L675)
        # ...and experimentation

        open_tag = self.helicone_tag_spacer + self.HELICONE_PROMPT_INPUT_OPEN + self.helicone_tag_spacer
        close_tag = self.helicone_tag_spacer + self.HELICONE_PROMPT_INPUT_CLOSE

        for token in super().parse(format_string):
            original_state = parser_state
            literal_text, field_name, format_spec, conversion_spec = token

            # check for reserved tags in the text
            for reserved_tag in self.reserved_tags:
                if reserved_tag in literal_text:
                    raise HeliconePromptFormatterError(
                        f"Helicone reserved tag ({reserved_tag}) found in input.  Not currently supported.  The reserved tags are:\n" + "\n".join(self.reserved_tags),
                        token,
                        format_string,
                    )
            if parser_state == "opened":
                # We've opened a tag, and are now closing a tag
                literal_text = f"{close_tag}{self.helicone_tag_spacer}{token[0]}"
                parser_state = "init"

            if parser_state == "init" and format_spec is not None:
                if field_name is None:
                    # this should be unreachable, the field_name is always defined for us if the format_spec is...
                    raise HeliconePromptFormatterError(
                        "Internal parse error (expected field_name to not be None).",
                        token,
                        format_string,
                    )

                # this is an arbitrary limitation, we could escape things or something, it depends on how the helicone is parsing out the tags on the backend...
                # throws on a format string like `'{foo[bar"]}'`
                #   ...even though `'{foo[bar"]}'.format(foo={'bar"': 'moo'}) == 'moo'`
                if self.valid_field_name_regex.match(field_name) is None:
                    raise HeliconePromptFormatterError(
                        f"Internal parse error: invalid field name (fields must match {self.valid_field_name_regex.pattern}).",
                        token,
                        format_string,
                    )
                # open a tag
                if field_name == "":
                    # we got an unamed field, i.e. '{}'
                    key_name = f"arg-{unnamed_args_count}"
                    unnamed_args_count += 1
                else:
                    key_name = field_name
                literal_text += open_tag.format(key_name=key_name)
                parser_state = "opened"
            new_token = (literal_text, field_name, format_spec, conversion_spec)
            transition = f"{original_state:<6} -> {parser_state:<6}"
            if new_token != token:
                log.debug(f"[{transition}] {token} <- {new_token}")
            else:
                log.debug(f"[{transition}] {token}")
            yield new_token

        if parser_state == "opened":
            final_token = (close_tag, None, None, None)
            log.debug(f"[opened ->   done] {final_token}")
            yield final_token
        log.debug("[PARSE COMPLETE]")

    def make_static(self, s: str) -> str:
        OPEN_TAG = self.helicone_tag_spacer + self.HELICONE_PROMPT_STATIC_OPEN + self.helicone_tag_spacer
        CLOSE_TAG = self.helicone_tag_spacer + self.HELICONE_PROMPT_STATIC_CLOSE

        return f"{OPEN_TAG}{s}{CLOSE_TAG}"
