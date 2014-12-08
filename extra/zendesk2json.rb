#!/usr/bin/ruby

require 'nokogiri'
require 'json'
require 'yaml'
require 'optparse'

parser = OptionParser.new do |opts|
  opts.banner = "
  Usage: #{ File.basename(__FILE__) } <xml directory>

  Convert Zendesk tickets (xml) to the json format for puavo-ticket import script
  "

  opts.on_tail("-h", "--help", "Show this message") do
    STDERR.puts opts
    exit
  end
end

parser.parse!

if ARGV.empty?
    STDERR.puts parser
    exit 1
end

zendesk_data_path = ARGV[0]

organisations_by_zendesk_id = YAML.load_file("organisation_by_id.yml")

status_by_zendesk_id = {
  "1" => "open",
  "2" => "open",
  "3" => "closed",
  "4" => "closed"
}

users_xml_data = File.open( File.join(zendesk_data_path, "users.xml") )

users_xml_doc = Nokogiri.XML(users_xml_data)

users_map = {}

users_xml_doc.xpath("users/user").each do |user_xml|
  user = {}

  zendesk_id = user_xml.at_xpath("id").text
  if zendesk_id.empty?
    puts "ERROR, zendesk_id is empty!"
    exit
  end
  user["zendesk_id"] = zendesk_id

  external_id = user_xml.at_xpath("external-id").text

  user["external_id"] = external_id


  user["email"] = user_xml.at_xpath("email").text
  user["name"] = user_xml.at_xpath("name").text
  user["organisation"] = organisations_by_zendesk_id[user_xml.at_xpath("organization-id").text]

  users_map[zendesk_id] = user
end

ticket_xml_data = File.open(File.join( zendesk_data_path, "tickets.xml") )
ticket_xml_doc = Nokogiri.XML(ticket_xml_data)

tickets = []
ticket_xml_doc.xpath("tickets/ticket").each do |ticket_xml|
  organisation = organisations_by_zendesk_id[ticket_xml.at_xpath("organization-id").text]

  next if organisation.to_s.empty?

  ticket = {}
  ticket["organisation"] = organisation
  ticket["title"] = ticket_xml.at_xpath("subject").text
  ticket["description"] = ticket_xml.at_xpath("description").text
  ticket["created_at"] = ticket_xml.at_xpath("created-at").text

  ticket["status_id"] = ticket_xml.at_xpath("status-id").text
  ticket["status"] = status_by_zendesk_id[ ticket_xml.at_xpath("status-id").text ]
  ticket["submitter"] = users_map[ ticket_xml.at_xpath("submitter-id").text ]
  ticket["requester"] = users_map[ ticket_xml.at_xpath("requester-id").text ]

  ticket["zendesk_id"] = ticket_xml.at_xpath("nice-id").text
  ticket["assignee"] = users_map[ ticket_xml.at_xpath("assignee-id").text ]

  ticket["comments"] = []
  ticket_xml.xpath("comments/comment").each do |comment_xml|
    zendesk_internal_comment_id = comment_xml.at_xpath("author-id").text
    commenter = users_map[ zendesk_internal_comment_id ]


    comment = {}
    comment["comment"] = comment_xml.at_xpath("value").text
    comment["type"] = comment_xml.at_xpath("type").text
    comment["commenter"] = commenter
    comment["created_at"] = comment_xml.at_xpath("created-at").text

    ticket["comments"].push comment
  end

  tickets.push ticket
end

puts tickets.to_json
